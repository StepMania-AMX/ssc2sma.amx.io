import { Nullable } from '../../util/common';

enum SmNoteBehavior {
  Fake = 'F',
  Bonus = 'B'
}

enum SmNoteDisplay {
  Hidden = 'H',
  Appear = 'A',
  Vanish = 'V'
}

enum SmNoteType {
  Empty = '0',
  Tap = '1',
  HoldHead = '2',
  HoldTail = '3',
  RollHead = '4',
  LongHead = '5',
  Mine = 'M',
  Potion = 'P',
  Shock = 'S',
  Attack = 'A',
  AutoKeysound = 'K',
  Lift = 'L',
  Fake = 'F'
}

const InfinityBehaviorToSmNoteBehavior = {
  B: SmNoteBehavior.Bonus,
  F: SmNoteBehavior.Fake
};

const InfinityDisplayToSmNoteDisplay = {
  Hidden: SmNoteDisplay.Hidden,
  Stealth: SmNoteDisplay.Vanish,
  Sudden: SmNoteDisplay.Appear
};

const InfinityNoteTypeP3P4Conflicts = new Set([
  'S', // StepMania AMX's shock arrow
  'Z' // StepF2's P3 tap
]);

const InfinityNoteTypeP3P4ToSmNoteType = new Map(
  Object.entries({
    E: SmNoteType.HoldTail,
    I: SmNoteType.Tap,
    S: SmNoteType.HoldHead,
    U: SmNoteType.Lift,
    W: SmNoteType.Mine,
    Z: SmNoteType.RollHead,
    '~': SmNoteType.Fake
  })
);

const SmNoteDisplayToInfinityDisplay = {
  [SmNoteDisplay.Hidden]: 'Hidden',
  [SmNoteDisplay.Vanish]: 'Stealth',
  [SmNoteDisplay.Appear]: 'Sudden'
};

const StepF2BehaviorToSmNoteBehavior = {
  '0': null,
  '1': SmNoteBehavior.Fake
};

const StepF2DisplayToSmNoteDisplay = {
  h: SmNoteDisplay.Hidden,
  n: null,
  s: SmNoteDisplay.Vanish,
  v: SmNoteDisplay.Appear
};

export default class SmNote {
  public static readonly Behavior = SmNoteBehavior;
  public static readonly Display = SmNoteDisplay;
  public static readonly Type = SmNoteType;

  public static createFromRow(
    player: number,
    column: number,
    row: string,
    isInfinity = false
  ): Nullable<SmNote> {
    if (column === 0) {
      SmNote.RowRegex.lastIndex = 0;
    }
    const match = SmNote.RowRegex.exec(row);
    if (match == null) {
      return null;
    }

    let noteType: SmNoteType = (match[1] as SmNoteType) || SmNote.Type.Empty;
    const [
      ,
      ,
      sf2NoteType,
      sf2Display,
      sf2Behavior,
      ,
      ,
      attack,
      attackLength,
      keySound,
      script,
      infBehavior,
      infDisplay
    ] = match;

    if (sf2NoteType != null) {
      noteType = (sf2NoteType as SmNoteType) || SmNote.Type.Empty;
    }

    if (InfinityNoteTypeP3P4ToSmNoteType.has(noteType)) {
      const hasConflict = InfinityNoteTypeP3P4Conflicts.has(noteType);
      if (isInfinity || !hasConflict) {
        noteType =
          InfinityNoteTypeP3P4ToSmNoteType.get(noteType) || SmNote.Type.Empty;
        player += 2;
      }
    }

    let smaDisplay = null;

    switch (noteType as string) {
      case SmNote.Type.Empty:
      case SmNote.Type.Tap:
      case SmNote.Type.HoldHead:
      case SmNote.Type.HoldTail:
      case SmNote.Type.RollHead:
      case SmNote.Type.LongHead:
      case SmNote.Type.Mine:
      case SmNote.Type.Potion:
      case SmNote.Type.Shock:
      case SmNote.Type.Attack:
      case SmNote.Type.AutoKeysound:
      case SmNote.Type.Lift:
      case SmNote.Type.Fake:
        // Do nothing
        break;

      case 'H':
        noteType = SmNote.Type.Tap;
        smaDisplay = SmNote.Display.Hidden;
        break;

      case 'X':
      case 'Y':
      case 'Z':
        player = noteType.charCodeAt(0) - 'W'.charCodeAt(0);
        noteType = SmNote.Type.Tap;
        break;

      case 'x':
      case 'y':
      case 'z':
        player = noteType.charCodeAt(0) - 'w'.charCodeAt(0);
        noteType = SmNote.Type.HoldHead;
        break;

      default:
        noteType = SmNote.Type.Empty;
        player = 0;
    }

    const note = new SmNote(column, noteType, player);
    if (noteType !== SmNote.Type.Empty) {
      note.behavior =
        InfinityBehaviorToSmNoteBehavior[infBehavior] ||
        StepF2BehaviorToSmNoteBehavior[sf2Behavior] ||
        null;
      note.display =
        smaDisplay ||
        InfinityDisplayToSmNoteDisplay[infDisplay] ||
        StepF2DisplayToSmNoteDisplay[sf2Display] ||
        null;
      note.keySound = parseInt(keySound, 10) || null;
      note.attack = attack || null;
      note.attackLength = parseFloat(attackLength) || null;
      note.script = script || null;
    }
    return note;
  }

  private static compiledRowRegex: Nullable<RegExp> = null;

  private static get RowRegex(): RegExp {
    if (this.compiledRowRegex == null) {
      this.compiledRowRegex = /(?:(?:([^{])|{(.)\|(.)\|(.)\|([^}]+)}|(?:{([^}]+)}))(?:{([^:}]+)\\?\:([\d.]+)})?(?:\[(\d+)])?(?:<([^>]+)>)?(?:\*(.))?(?:\^(\w+)\^)?)/g;
    }
    return this.compiledRowRegex;
  }

  public column: number;
  public type: SmNoteType = SmNoteType.Empty;
  public player: number;
  public behavior: Nullable<SmNoteBehavior> = null;
  public display: Nullable<SmNoteDisplay> = null;
  public keySound: Nullable<number> = null;
  public attack: Nullable<string> = null;
  public attackLength: Nullable<number> = null;
  public script: Nullable<string> = null;

  constructor(
    column: number,
    type: SmNoteType = SmNote.Type.Empty,
    player: number = 0
  ) {
    this.column = column;
    this.type = type;
    this.player = player;
  }

  public toString(): string {
    if (this.type === SmNote.Type.Empty) {
      return '0';
    }
    const parts = [this.type as string];
    if (this.attack != null) {
      parts.push(`{${this.attack}\\:${(this.attackLength || 0).toFixed(3)}}`);
    }
    if (this.keySound != null) {
      parts.push(`[${this.keySound.toFixed(0)}]`);
    }
    if (this.script != null) {
      parts.push(`<${this.script}>`);
    }
    if (this.behavior != null) {
      parts.push(`*${this.behavior}`);
    }
    if (this.display != null) {
      parts.push(`^${SmNoteDisplayToInfinityDisplay[this.display]}^`);
    }
    return parts.join('');
  }

  public toSmaString(): string {
    switch (this.type) {
      case SmNote.Type.Empty:
      case SmNote.Type.Attack:
      case SmNote.Type.AutoKeysound:
      case SmNote.Type.Fake:
        return '0';
    }
    if (this.behavior === SmNote.Behavior.Fake) {
      return '0';
    }
    if (
      this.display === SmNote.Display.Hidden &&
      this.type === SmNote.Type.Tap
    ) {
      return 'H';
    }
    return this.type as string;
  }
}
