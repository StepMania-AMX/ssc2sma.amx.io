import SmStep from '../sm/step';

export default class SscLoader {
  protected static splitKeyValue = (keyValue: string) =>
    keyValue
      .split(/(?<!\\)=/)
      .map((s) => s.trim())
      .filter((s) => s !== '');

  protected static splitTagKeyValues(
    tagValues: Map<string, any>,
    name: string
  ) {
    if (!tagValues.has(name)) {
      return;
    }
    const splitValues = tagValues
      .get(name)
      .map((keyValue: string) => this.splitKeyValue(keyValue));
    tagValues.set(name, splitValues);
  }

  protected static splitTagValues(
    tagValues: Map<string, any>,
    name: string,
    splitKeyValue: boolean = true
  ) {
    if (!tagValues.has(name)) {
      return;
    }
    const splitValues = tagValues.get(name).map((rawValue: string) =>
      rawValue
        .split(/(?<!\\),/)
        .map((s) => s.trim())
        .filter((s) => s !== '')
        .map((value) => (splitKeyValue ? this.splitKeyValue(value) : value))
    );
    tagValues.set(name, splitValues);
  }

  private static emptyAttack = Object.freeze({
    LEN: null,
    MODS: null,
    TIME: null
  });

  private static parseSscFileRegex = /^#((?:[^;](?!^#)|(?:\\;))+)(?:(?<!\\);[^\r\n]*)?$/gim;

  public isInfinity = false;
  public globalTags: Map<string, any> = new Map();
  public messages: string[] = [];
  public stepTags: Array<Map<string, any>> = [];

  constructor(content: string | null) {
    if (content == null) {
      return;
    }
    let currentMap = this.globalTags;
    for (let [tag, ...values] of this.parse(content)) {
      tag = tag.toUpperCase();
      if (tag === 'NOTEDATA') {
        currentMap = new Map();
        this.stepTags.push(currentMap);
      }
      currentMap.set(tag, values);
    }
    this.isInfinity = this.globalTags.has('BGAPREVIEW');
    if (!this.isInfinity && this.stepTags.length > 0) {
      const [radarValues = ''] = this.stepTags[0].get('RADARVALUES') || [];
      this.isInfinity = parseFloat(radarValues) > 1;
    }
    const [version = null] = this.globalTags.get('VERSION') || [];
    if (version == null) {
      this.messages.push(
        'The #VERSION tag is not present, assuming 0.83 which was the last known version.'
      );
    } else if (parseFloat(version) > 0.83) {
      this.messages.push(
        'This .ssc file is written for a more recent version than 0.83 and may have incompatible features that will be ignored.'
      );
    }

    this.prepareGlobalTags();
    for (const stepTags of this.stepTags) {
      this.prepareStepTags(stepTags);
    }
  }

  public getStepTagValue(stepTags: Map<string, any>, key: string) {
    if (stepTags.has(key)) {
      return stepTags.get(key);
    }
    return this.globalTags.get(key) || [];
  }

  public parse(content: string) {
    const matches = [];
    let match;
    SscLoader.parseSscFileRegex.lastIndex = 0;
    do {
      match = SscLoader.parseSscFileRegex.exec(content);
      if (match) {
        matches.push(
          match[1]
            .split(/(?<!\\):/)
            .map((s) => s.trim())
            .filter((s) => s !== '')
        );
      }
    } while (match);
    return matches;
  }

  protected adjustAttacks(tagValues: Map<string, any>) {
    if (!tagValues.has('ATTACKS')) {
      return;
    }
    const attacks = [];
    let currentAttack = { ...SscLoader.emptyAttack };
    for (const [key, value = ''] of tagValues.get('ATTACKS')) {
      if (key === 'MODS') {
        currentAttack.MODS = value
          .split(/(?<!\\),/)
          .map((s: string) => s.trim())
          .filter((s: string) => s !== '');
        if (currentAttack.MODS !== '') {
          attacks.push(currentAttack);
        }
        currentAttack = { ...SscLoader.emptyAttack };
      } else {
        currentAttack[key] = value;
      }
    }
    if (Object.values(currentAttack).every((v) => v != null)) {
      attacks.push(currentAttack);
    }
    tagValues.set('ATTACKS', attacks);
  }

  protected parseNotes(stepTags: Map<string, any>, notesKey: string) {
    if (!stepTags.has(notesKey)) {
      return;
    }
    const notes = (stepTags.get(notesKey)[0] || '')
      .split(/(?<!\\)&/)
      .map((playerNotes: string) =>
        playerNotes.split(/(?<!\\),/).map((measure: string) =>
          measure
            .split(/[\r\n]+/)
            .map((row: string) => row.replace(/\/\/.*$/, '').trim())
            .filter((row: string) => row !== '')
        )
      );
    let player = 0;
    const step = new SmStep();
    step.isInfinity = this.isInfinity;
    step.setNumColumnsFromStepStyle(
      stepTags.get('STEPSTYPE')[0] || 'dance-single'
    );
    for (const playerNotes of notes) {
      let rowStart = 0;
      for (const measure of playerNotes) {
        rowStart = step.addMeasure(rowStart, measure, player);
      }
      player++;
    }
    step.sort();
    stepTags.set(notesKey, step);
  }

  protected prepareGlobalTags() {
    // %s
    SscLoader.splitTagValues(this.globalTags, 'KEYSOUNDS', false);
    SscLoader.splitTagValues(this.globalTags, 'DISPLAYBPM', false);

    // %s=%s
    SscLoader.splitTagValues(this.globalTags, 'INSTRUMENTTRACK');

    // %.03f=%s
    SscLoader.splitTagValues(this.globalTags, 'LABELS');

    // %.03f=%.03f
    SscLoader.splitTagValues(this.globalTags, 'BPMS');
    SscLoader.splitTagValues(this.globalTags, 'STOPS');
    SscLoader.splitTagValues(this.globalTags, 'DELAYS');
    SscLoader.splitTagValues(this.globalTags, 'WARPS');
    SscLoader.splitTagValues(this.globalTags, 'SCROLLS');
    SscLoader.splitTagValues(this.globalTags, 'FAKES');

    // %.03f=%i
    SscLoader.splitTagValues(this.globalTags, 'TICKCOUNTS');

    // %.03f=%i=%i
    SscLoader.splitTagValues(this.globalTags, 'TIMESIGNATURES');
    SscLoader.splitTagValues(this.globalTags, 'COMBOS'); // may have %.03f=%i

    // %.03f=%.03f=%.03f=%u
    SscLoader.splitTagValues(this.globalTags, 'SPEEDS');

    // Compatible Tags: Beat, File, Rate, isFadeLast, isRewind, isLoop
    // Incompatible Tags: Effect, File2, Transition, Color1, Color2
    // %.3f=%s=%.3f=%d=%d=%d=%s=%s=%s=%s=%s
    SscLoader.splitTagValues(this.globalTags, 'BGCHANGES');
    SscLoader.splitTagValues(this.globalTags, 'BGCHANGES2');
    SscLoader.splitTagValues(this.globalTags, 'FGCHANGES');

    // Attacks are not separated by comma because of the `MODS` tag
    SscLoader.splitTagKeyValues(this.globalTags, 'ATTACKS');
    this.adjustAttacks(this.globalTags);
  }

  protected prepareStepTags(stepTags: Map<string, any>) {
    // %s
    SscLoader.splitTagValues(stepTags, 'DISPLAYBPM', false);

    // %.03f=%s
    SscLoader.splitTagValues(stepTags, 'LABELS');

    // %.03f=%.03f
    SscLoader.splitTagValues(stepTags, 'BPMS');
    SscLoader.splitTagValues(stepTags, 'STOPS');
    SscLoader.splitTagValues(stepTags, 'DELAYS');
    SscLoader.splitTagValues(stepTags, 'WARPS');
    SscLoader.splitTagValues(stepTags, 'SCROLLS');
    SscLoader.splitTagValues(stepTags, 'FAKES');

    // %.03f=%i
    SscLoader.splitTagValues(stepTags, 'TICKCOUNTS');

    // %.03f=%i=%i
    SscLoader.splitTagValues(stepTags, 'TIMESIGNATURES');
    SscLoader.splitTagValues(stepTags, 'COMBOS'); // may have %.03f=%i

    // %.03f=%.03f=%.03f=%u
    SscLoader.splitTagValues(stepTags, 'SPEEDS');

    // Multiples ints or floats
    SscLoader.splitTagValues(stepTags, 'RADARVALUES');

    // Attacks are not separated by comma because of the `MODS` tag
    SscLoader.splitTagKeyValues(stepTags, 'ATTACKS');
    this.adjustAttacks(stepTags);

    // Notes
    this.parseNotes(stepTags, 'NOTES');
    this.parseNotes(stepTags, 'NOTES2');
  }
}
