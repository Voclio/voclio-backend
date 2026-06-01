import { jest } from '@jest/globals';
import { successResponse, errorResponse, paginatedResponse } from '../../src/utils/responses.js';

describe('API responses', () => {
  const createRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  test('successResponse returns standardized success envelope', () => {
    const res = createRes();
    const data = { id: 1 };

    successResponse(res, data, 'OK', 201);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'OK',
      data
    });
  });

  test('errorResponse returns standardized error envelope', () => {
    const res = createRes();
    const error = { code: 'NOT_FOUND', message: 'Missing', details: null };

    errorResponse(res, error, 404);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error
    });
  });

  test('paginatedResponse includes pagination metadata', () => {
    const res = createRes();

    paginatedResponse(res, [{ id: 1 }], { page: 1, limit: 10, total: 25 });

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [{ id: 1 }],
      pagination: {
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3
      }
    });
  });
});
