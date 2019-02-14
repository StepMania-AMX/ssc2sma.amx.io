import SmStep from '../sm/step';
import SscLoader from '../ssc';

// TODO: Remove modifiers that are not allowed in #ATTACKS
const smaModifiers = new Set([
  'alternate',
  'appearanceglow',
  'assisttick',
  'attackmines',
  'autosync',
  'backwards',
  'bar',
  'battery',
  'beat',
  'big',
  'blind',
  'blink',
  'bmrize',
  'boomerang',
  'boost',
  'brake',
  'bumpy',
  'centered',
  'clearall',
  'confusion',
  'converge',
  'cover',
  'cross',
  'dark',
  'distant',
  'dizzy',
  'drop',
  'drunk',
  'echo',
  'expand',
  'flip',
  'floored',
  'gauge',
  'halfmines',
  'halfpotions',
  'halfshocks',
  'hallway',
  'hidden',
  'hiddenoffset',
  'holdrolls',
  'incoming',
  'invert',
  'land',
  'left',
  'leftattack',
  'life',
  'lifts',
  'little',
  'lives',
  'mines',
  'mineshocks',
  'mini',
  'mirror',
  'nofreeze',
  'nohands',
  'nohidden',
  'noholds',
  'nojumps',
  'nolifts',
  'nomines',
  'nopositioning',
  'nopotions',
  'noquads',
  'norolls',
  'noshocks',
  'noteskin',
  'overhead',
  'passmark',
  'planted',
  'playerassisttick',
  'playerautoplay',
  'playerautosync',
  'playersingletouch',
  'potions',
  'protiming',
  'quick',
  'randomattacks',
  'randomvanish',
  'reverse',
  'reversegrade',
  'right',
  'rightattack',
  'shocks',
  'shuffle',
  'singletouch',
  'skippy',
  'smjudgments',
  'songattacks',
  'space',
  'split',
  'stealth',
  'stomp',
  'sudden',
  'suddenoffset',
  'supershuffle',
  'tiny',
  'tipsy',
  'tornado',
  'turn',
  'twister',
  'underattack',
  'wave',
  'wide',
  'x-rotation',
  'y-rotation',
  'z-rotation'
]);

const sscUnits = ['', 's'];

export default class SmaLoader {
  public static importFromSsc(sscLoader: SscLoader) {
    const loader = new SmaLoader();
    loader.globalTags.set('TITLE', sscLoader.globalTags.get('TITLE'));
    loader.globalTags.set('SUBTITLE', sscLoader.globalTags.get('SUBTITLE'));
    loader.globalTags.set('ARTIST', sscLoader.globalTags.get('ARTIST'));
    loader.globalTags.set(
      'TITLETRANSLIT',
      sscLoader.globalTags.get('TITLETRANSLIT')
    );
    loader.globalTags.set(
      'SUBTITLETRANSLIT',
      sscLoader.globalTags.get('SUBTITLETRANSLIT')
    );
    loader.globalTags.set(
      'ARTISTTRANSLIT',
      sscLoader.globalTags.get('ARTISTTRANSLIT')
    );
    loader.globalTags.set('GENRE', sscLoader.globalTags.get('GENRE'));
    loader.globalTags.set('MENUCOLOR', []);
    loader.globalTags.set('BANNER', sscLoader.globalTags.get('BANNER'));
    loader.globalTags.set('DISC', sscLoader.globalTags.get('DISCIMAGE'));
    loader.globalTags.set('BACKGROUND', sscLoader.globalTags.get('BACKGROUND'));
    loader.globalTags.set(
      'PREVIEW',
      sscLoader.isInfinity
        ? sscLoader.globalTags.get('BGAPREVIEW')
        : sscLoader.globalTags.get('PREVIEWVID')
    );
    loader.globalTags.set('LYRICSPATH', sscLoader.globalTags.get('LYRICSPATH'));
    loader.globalTags.set('CDTITLE', sscLoader.globalTags.get('CDTITLE'));
    loader.globalTags.set('INTRO', sscLoader.globalTags.get('PREVIEW'));
    loader.globalTags.set('MUSIC', sscLoader.globalTags.get('MUSIC'));
    loader.globalTags.set(
      'SAMPLESTART',
      sscLoader.globalTags.get('SAMPLESTART')
    );
    loader.globalTags.set(
      'SAMPLELENGTH',
      sscLoader.globalTags.get('SAMPLELENGTH')
    );
    loader.globalTags.set('SELECTABLE', sscLoader.globalTags.get('SELECTABLE'));
    loader.globalTags.set('SMAVERSION', ['1.0.0']);
    loader.globalTags.set('ROWSPERBEAT', [[['0', '48']]]);
    loader.globalTags.set('BEATSPERMEASURE', [[['0', '4']]]);
    loader.globalTags.set('OFFSET', sscLoader.globalTags.get('OFFSET'));
    loader.globalTags.set('BPMS', sscLoader.globalTags.get('BPMS'));
    loader.globalTags.set('STOPS', sscLoader.globalTags.get('STOPS'));
    loader.globalTags.set(
      'BGCHANGES',
      loader.convertSscBgChanges(
        sscLoader.globalTags.get('BGCHANGES'),
        SmaLoader.noSongBgChange
      )
    );
    loader.globalTags.set(
      'FGCHANGES',
      loader.convertSscBgChanges(sscLoader.globalTags.get('FGCHANGES'), [])
    );

    for (const stepTag of sscLoader.stepTags) {
      loader.importFromSscStepTag(sscLoader, stepTag);
    }
    return loader;
  }

  protected static defaultMultiplier = [[['0.000', '1']]];
  protected static defaultSpeedChange = [[['0.000', '1.000']]];
  protected static noSongBgChange = [
    [
      [
        '99999',
        '-nosongbg-',
        '1.000',
        '0',
        '0',
        "0 // don't automatically add -songbackground-"
      ]
    ]
  ];

  public globalTags: Map<string, any> = new Map();
  public messages: string[] = [];
  public stepTags: Array<Map<string, any>> = [];

  public toString() {
    const lines: string[] = [];
    for (const [tag, rawValues = []] of this.globalTags.entries()) {
      let values = rawValues;
      switch (tag) {
        case 'ROWSPERBEAT':
        case 'BEATSPERMEASURE':
        case 'BPMS':
        case 'STOPS':
        case 'BGCHANGES':
        case 'FGCHANGES':
          values = rawValues.map((value: string[][]) =>
            value
              .map((timingValues: string[]) => timingValues.join('='))
              .join(',\r\n')
          );
      }
      const lineAtStart = values.length > 1 ? '\r\n' : '';
      const lineAtEnd = tag === 'BGCHANGES' ? '\r\n' : '';
      lines.push(`#${tag}:${lineAtStart}${values.join(':\r\n')}${lineAtEnd};`);
    }

    for (const tags of this.stepTags) {
      const [stepsType, description] = tags.get('NOTES');
      lines.push('');
      lines.push(
        `//---------------${stepsType} - ${description}----------------`
      );
      for (const [tag, rawValues = []] of tags) {
        let values = rawValues;
        switch (tag) {
          case 'ROWSPERBEAT':
          case 'BEATSPERMEASURE':
          case 'BPMS':
          case 'STOPS':
          case 'DELAYS':
          case 'TICKCOUNT':
          case 'SPEED':
          case 'MULTIPLIER':
          case 'FAKES':
          case 'SPDAREAS':
            values = rawValues.map((value: string[][]) =>
              value
                .map((timingValues: string[]) => timingValues.join('='))
                .join(',\r\n')
            );
            break;

          case 'ATTACKS':
            values = rawValues.map(
              ({ LEN, MODS, TIME }: any) =>
                `TIME=${parseFloat(TIME).toFixed(3)}:LEN=${parseFloat(
                  LEN
                ).toFixed(3)}:MODS=${MODS}`
            );
            break;

          case 'NOTES':
            values = rawValues.map((value: any, i: number) =>
              i === 5 ? value : `\t${value}`
            );
        }
        if (tag === 'DISPLAYBPM') {
          lines.push(`#${tag}:${values.join(':')};`);
        } else {
          const lineAtStart = values.length > 1 ? '\r\n' : '';
          lines.push(`#${tag}:${lineAtStart}${values.join(':\r\n')};`);
        }
      }
    }
    return lines.join('\r\n');
  }

  protected convertSscAttacks(attacks: any[] | null) {
    if (attacks == null || attacks.length === 0) {
      return [];
    }
    return attacks.filter((attack) =>
      attack.MODS.every((mod: string) => {
        const parts = mod.split(' ');
        const modName = parts[parts.length - 1].toLowerCase();
        return (
          smaModifiers.has(modName) ||
          /^(?:(?:c\d+)|(?:[\d\.]+x))$/.test(modName)
        );
      })
    );
  }

  protected convertSscBgChanges(
    bgChanges: string[][][] | null,
    valueIfError: string[][][] | null = null
  ) {
    if (bgChanges == null || bgChanges.length === 0) {
      return valueIfError;
    }
    const convertedBgChanges: string[][][] = [[]];
    for (const bgChange of bgChanges[0]) {
      const file = bgChange[1].toLowerCase();
      if (file.endsWith('.xml') || file.endsWith('.lua')) {
        this.messages.push('BGChanges in Lua or XML detected, discarding.');
        return valueIfError;
      }
      const convertedBgChange = [...bgChange];
      convertedBgChange.length = Math.min(convertedBgChange.length, 6);
      convertedBgChanges[0].push(convertedBgChange);
    }
    return convertedBgChanges;
  }

  protected convertSscCombos(
    combos: string[][][] | null,
    valueIfError: string[][][] | null = null
  ) {
    if (combos == null || combos.length === 0) {
      return valueIfError;
    }
    const multipliers: string[][][] = [[]];
    for (const [beat, hit, miss] of combos[0]) {
      const convertedMultiplier = [beat, hit];
      if (miss == null) {
        convertedMultiplier.push(hit);
      } else {
        convertedMultiplier.push(miss);
      }
      convertedMultiplier.push('1.000');
      multipliers[0].push(convertedMultiplier);
    }
    return multipliers;
  }

  protected convertSscNotes(
    sscLoader: SscLoader,
    sscStepTag: Map<string, any>
  ) {
    const stepsType = sscLoader.getStepTagValue(sscStepTag, 'STEPSTYPE')[0];
    const description = sscLoader.getStepTagValue(sscStepTag, 'DESCRIPTION')[0];
    const difficulty = sscLoader.getStepTagValue(sscStepTag, 'DIFFICULTY')[0];
    const meter = sscLoader.getStepTagValue(sscStepTag, 'METER')[0];
    const radarValues = sscLoader.isInfinity
      ? new Array(5).fill('0.000')
      : sscLoader.getStepTagValue(sscStepTag, 'RADARVALUES')[0] || [];
    if (radarValues.length < 5) {
      radarValues.length = 0;
      radarValues.length = 5;
      radarValues.fill('0.000');
    } else {
      radarValues.length = 5;
    }
    const notes: SmStep = sscLoader.getStepTagValue(sscStepTag, 'NOTES');
    for (const row of notes.rows.values()) {
      for (const note of row.values()) {
        if (note.attack == null) {
          continue;
        }
        note.attack = note.attack
          .split(/(?<!\\),/)
          .map((attack) => {
            attack = attack.trim();
            const parts = attack.split(' ');
            if (smaModifiers.has(parts[parts.length - 1].toLowerCase())) {
              return attack;
            }
            return '';
          })
          .filter((attack) => attack !== '')
          .join(',');
        if (note.attack === '') {
          note.attack = null;
          note.attackLength = null;
        }
      }
    }
    const smaNotes = {
      notes,
      toString: () => notes.toSmaString()
    };
    return [stepsType, description, difficulty, meter, radarValues, smaNotes];
  }

  protected convertSscScrolls(scrolls: string[][][] | null, numBeats: number) {
    if (scrolls == null || scrolls.length === 0) {
      return [];
    }
    const speedAreas: string[][][] = [[]];
    let currentSpeedArea: string[] | null = null;
    for (const [beat, scroll] of scrolls[0]) {
      if (currentSpeedArea != null) {
        const previousBeat = parseFloat(currentSpeedArea[0]);
        currentSpeedArea[3] = (parseFloat(beat) - previousBeat).toFixed(3);
        currentSpeedArea = null;
      }
      if (parseFloat(scroll) !== 1.0) {
        currentSpeedArea = [
          beat,
          scroll,
          scroll,
          (numBeats - parseFloat(beat)).toFixed(3)
        ];
        speedAreas[0].push(currentSpeedArea);
      }
    }
    return speedAreas;
  }

  protected convertSscSpeedChanges(
    speedChanges: string[][][] | null,
    valueIfError: string[][][] | null = null
  ) {
    if (speedChanges == null || speedChanges.length === 0) {
      return valueIfError;
    }
    const convertedSpeedChanges: string[][][] = [[]];
    for (const [beat, speed, length, unit] of speedChanges[0]) {
      const convertedSpeedChange = [beat, speed];
      if (sscUnits[unit] == null) {
        this.messages.push(
          `Unrecognized Speed Unit ${unit}, length will be omitted.`
        );
      } else {
        convertedSpeedChange.push(`${length}${sscUnits[unit]}`);
      }
      convertedSpeedChanges[0].push(convertedSpeedChange);
    }
    return convertedSpeedChanges;
  }

  protected getDisplayBpm(
    tags: Map<string, any>,
    displayBpmFromSsc: string[][][] | null
  ) {
    if (displayBpmFromSsc != null && displayBpmFromSsc.length > 0) {
      const [minBpmFromSsc, maxBpmFromSsc] = displayBpmFromSsc[0];
      if (minBpmFromSsc != null) {
        if (maxBpmFromSsc != null) {
          return [minBpmFromSsc, maxBpmFromSsc];
        }
        return [minBpmFromSsc];
      }
    }
    const [bpms] = tags.get('BPMS') || [[]];
    let minBpm = Infinity;
    let maxBpm = -Infinity;
    for (const [, bpm] of bpms) {
      maxBpm = Math.max(bpm, maxBpm);
      minBpm = Math.min(bpm, minBpm);
    }
    if (minBpm === maxBpm) {
      return [`${minBpm.toFixed(3)}*`];
    }
    return [`${minBpm.toFixed(3)}`, `${maxBpm.toFixed(3)}*`];
  }

  protected getSscMeterType(sscStepTag: Map<string, any>) {
    const [stepsType] = sscStepTag.get('STEPSTYPE') || [''];
    if (stepsType.toLowerCase().startsWith('pump')) {
      return ['PIU NX2'];
    }
    return ['DDR'];
  }

  protected importFromSscStepTag(
    sscLoader: SscLoader,
    sscStepTag: Map<string, any>
  ) {
    const stepTag = new Map();

    const numBeats = 99999;
    stepTag.set('CREDIT', sscLoader.getStepTagValue(sscStepTag, 'CREDIT'));
    stepTag.set('ROWSPERBEAT', [[['0', '48']]]);
    stepTag.set('BEATSPERMEASURE', [[['0', '4']]]);
    stepTag.set('OFFSET', sscLoader.getStepTagValue(sscStepTag, 'OFFSET'));
    stepTag.set('BPMS', sscLoader.getStepTagValue(sscStepTag, 'BPMS'));
    stepTag.set('STOPS', sscLoader.getStepTagValue(sscStepTag, 'STOPS'));
    stepTag.set('DELAYS', sscLoader.getStepTagValue(sscStepTag, 'DELAYS'));
    stepTag.set(
      'TICKCOUNT',
      sscLoader.getStepTagValue(sscStepTag, 'TICKCOUNTS')
    );
    stepTag.set(
      'SPEED',
      this.convertSscSpeedChanges(
        sscLoader.getStepTagValue(sscStepTag, 'SPEED'),
        SmaLoader.defaultSpeedChange
      )
    );
    stepTag.set(
      'MULTIPLIER',
      this.convertSscCombos(
        sscLoader.getStepTagValue(sscStepTag, 'COMBOS'),
        SmaLoader.defaultMultiplier
      )
    );
    stepTag.set('FAKES', sscLoader.getStepTagValue(sscStepTag, 'FAKES'));
    stepTag.set(
      'SPDAREAS',
      this.convertSscScrolls(
        sscLoader.getStepTagValue(sscStepTag, 'SCROLLS'),
        numBeats
      )
    );
    stepTag.set(
      'DISPLAYBPM',
      this.getDisplayBpm(
        stepTag,
        sscLoader.getStepTagValue(sscStepTag, 'DISPLAYBPM')
      )
    );
    stepTag.set('METERTYPE', this.getSscMeterType(sscStepTag));
    stepTag.set(
      'ATTACKS',
      this.convertSscAttacks(sscLoader.getStepTagValue(sscStepTag, 'ATTACKS'))
    );
    stepTag.set('NOTES', this.convertSscNotes(sscLoader, sscStepTag));

    this.stepTags.push(stepTag);
  }
}
