import gcd from 'gcd';
import { Nullable } from '../../util/common';
import SmNote from './note';

const numColumnsByStepStyle = {
  'bm-double': 12,
  'bm-double5': 12,
  'bm-double7': 16,
  'bm-single': 6,
  'bm-single5': 6,
  'bm-single7': 8,
  'bm-versus5': 6,
  'bm-versus7': 8,
  'dance-couple': 8,
  'dance-double': 8,
  'dance-routine': 8,
  'dance-single': 4,
  'dance-solo': 6,
  'dance-threepanel': 3,
  'ds3ddx-single': 8,
  'ez2-double': 10,
  'ez2-real': 7,
  'ez2-single': 5,
  'iidx-double5': 12,
  'iidx-double7': 16,
  'iidx-single5': 6,
  'iidx-single7': 8,
  'kb7-single': 7,
  'kb7-small': 7,
  'kickbox-arachnid': 8,
  'kickbox-human': 4,
  'kickbox-insect': 6,
  'kickbox-quadarm': 4,
  'lights-cabinet': 8,
  'maniax-double': 8,
  'maniax-single': 4,
  'para-single': 5,
  'pnm-five': 5,
  'pnm-nine': 9,
  'pump-couple': 10,
  'pump-double': 10,
  'pump-halfdouble': 6,
  'pump-routine': 10,
  'pump-single': 5,
  'techno-double4': 8,
  'techno-double5': 10,
  'techno-double8': 16,
  'techno-single4': 4,
  'techno-single5': 5,
  'techno-single8': 8
};

export default class SmStep {
  public beatsPerMeasure: Map<number, number> = new Map();
  public numColumns = 0;
  public rowsPerBeat: Map<number, number> = new Map();
  public rows: Map<number, Map<number, SmNote>> = new Map();
  public isInfinity = false;

  constructor() {
    this.beatsPerMeasure.set(0, 4);
    this.rowsPerBeat.set(0, 48);
  }

  public addNoteAtRow(rowNumber: number, note: Nullable<SmNote>) {
    if (note == null || note.type === SmNote.Type.Empty) {
      return;
    }
    const row = this.rows.get(rowNumber) || new Map();
    row.set(note.column, note);
    this.rows.set(rowNumber, row);
  }

  public addMeasure(rowStart: number, measure: string[], player = 0) {
    // TODO: Variable RowsPerBeat / BeatsPerMeasure
    const beatsPerMeasure = this.beatsPerMeasure.values().next().value;
    const rowsPerBeat = this.rowsPerBeat.values().next().value;
    let rowNumber = rowStart;
    for (const row of measure) {
      let column = -1;
      let note;
      do {
        note = SmNote.createFromRow(player, ++column, row, this.isInfinity);
        this.addNoteAtRow(rowNumber, note);
      } while (note != null);
      rowNumber += Math.floor((rowsPerBeat * beatsPerMeasure) / measure.length);
    }
    return rowNumber;
  }

  public setBeatsPerMeasureFromValues([values]: string[][] = [['0', '4']]) {
    this.beatsPerMeasure.clear();
    for (const [beat, beatsPerMeasure] of values) {
      this.beatsPerMeasure.set(parseFloat(beat), parseInt(beatsPerMeasure, 10));
    }
  }

  public setNumColumnsFromStepStyle(stepStyle: string) {
    this.numColumns = numColumnsByStepStyle[stepStyle];
  }

  public setRowsPerBeatFromValues([values]: string[][] = [['0', '48']]) {
    this.rowsPerBeat.clear();
    for (const [beat, rowsPerBeat] of values) {
      this.rowsPerBeat.set(parseFloat(beat), parseInt(rowsPerBeat, 10));
    }
  }

  public sort() {
    this.rows = new Map([...this.rows].sort(([a], [b]) => a - b));
    for (const [rowNumber, row] of this.rows.entries()) {
      this.rows.set(rowNumber, new Map([...row].sort(([a], [b]) => a - b)));
    }
  }

  public toString(useSmaString = false) {
    const remainingRows: Map<number, Map<number, SmNote>> = new Map();
    const rowsByPlayer: Array<Map<number, Map<number, SmNote>>> = [new Map()];

    // Use the first pass to also deep clone the rows to `remainingRows`
    let currentPlayer = 0;
    for (const [rowNumber, row] of this.rows) {
      const rowByPlayer = new Map();
      const remainingRow = new Map();
      for (const [column, note] of row) {
        if (note.player === currentPlayer) {
          rowByPlayer.set(column, note);
        } else {
          remainingRow.set(column, note);
        }
      }
      if (rowByPlayer.size > 0) {
        rowsByPlayer[currentPlayer].set(rowNumber, rowByPlayer);
      }
      if (remainingRow.size > 0) {
        remainingRows.set(rowNumber, remainingRow);
      }
    }

    while (remainingRows.size > 0) {
      currentPlayer++;
      rowsByPlayer.push(new Map());
      for (const [rowNumber, row] of remainingRows) {
        const rowByPlayer = new Map();
        for (const [column, note] of row) {
          if (note.player === currentPlayer) {
            rowByPlayer.set(column, note);
            row.delete(column);
          }
        }
        if (rowByPlayer.size > 0) {
          rowsByPlayer[currentPlayer].set(rowNumber, rowByPlayer);
        }
        if (row.size === 0) {
          remainingRows.delete(rowNumber);
        }
      }
    }

    // TODO: Variable RowsPerBeat / BeatsPerMeasure
    const beatsPerMeasure = this.beatsPerMeasure.values().next().value;
    const rowsPerBeat = this.rowsPerBeat.values().next().value;
    const rowsPerMeasure = rowsPerBeat * beatsPerMeasure;
    const emptyRow = new Array(this.numColumns).fill('0').join('');
    const linesByPlayer: any = [];
    for (const playerRows of rowsByPlayer) {
      currentPlayer = linesByPlayer.length;
      linesByPlayer.push([]);
      let startRow = 0;
      while (playerRows.size > 0) {
        const rowsThisMeasure = new Map();
        const endRow = startRow + rowsPerMeasure;
        for (const [rowNumber, row] of playerRows) {
          if (rowNumber > endRow) {
            break;
          }
          rowsThisMeasure.set(rowNumber, row);
          playerRows.delete(rowNumber);
        }
        const resolution =
          [...rowsThisMeasure.keys()].reduce(
            (res, row) =>
              Math.max(res, Math.floor(rowsPerBeat / gcd(row, rowsPerBeat))),
            1
          ) * beatsPerMeasure;
        const lines = [];
        for (let r = 0; r < resolution; r++) {
          const rowNumber = startRow + (r * rowsPerMeasure) / resolution;
          if (!rowsThisMeasure.has(rowNumber)) {
            lines.push(emptyRow);
            continue;
          }
          const cols = [];
          const row = rowsThisMeasure.get(rowNumber);
          for (let c = 0; c < this.numColumns; c++) {
            if (!row.has(c)) {
              cols.push('0');
              continue;
            }
            const note = row.get(c);
            cols.push(useSmaString ? note.toSmaString() : note.toString());
          }
          lines.push(cols.join(''));
        }
        linesByPlayer[currentPlayer].push(lines.join('\r\n'));
        startRow = endRow;
      }
      linesByPlayer[currentPlayer] = linesByPlayer[currentPlayer].join(
        '\r\n,\r\n'
      );
    }
    return linesByPlayer.join('\r\n&\r\n');
  }

  public toSmaString() {
    return this.toString(true);
  }
}
