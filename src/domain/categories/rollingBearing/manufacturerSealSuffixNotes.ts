import { getNskEquivalentCheckNotesTr } from './nskSealSuffixNotes';
import { getNtnEquivalentCheckNotesTr } from './ntnSealSuffixNotes';

export function getManufacturerSealSuffixCheckNotesTr(manufacturer: string): string[] {
  return [
    ...getNtnEquivalentCheckNotesTr(manufacturer),
    ...getNskEquivalentCheckNotesTr(manufacturer),
  ];
}
