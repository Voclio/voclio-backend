import { parseJsonArray, parseJsonObject } from '../../src/services/ai/jsonParser.js';

describe('AI jsonParser', () => {
  test('parseJsonArray parses direct JSON arrays', () => {
    expect(parseJsonArray('[{"title":"Task"}]')).toEqual([{ title: 'Task' }]);
  });

  test('parseJsonArray extracts arrays from code blocks', () => {
    const content = 'Here:\n```json\n[{"title":"Task"}]\n```';
    expect(parseJsonArray(content)).toEqual([{ title: 'Task' }]);
  });

  test('parseJsonArray returns fallback on invalid content', () => {
    expect(parseJsonArray('not json', [])).toEqual([]);
  });

  test('parseJsonObject parses JSON objects', () => {
    expect(parseJsonObject('{"tasks":[],"notes":[]}')).toEqual({ tasks: [], notes: [] });
  });
});
