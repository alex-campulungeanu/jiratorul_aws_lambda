const updateDetailsSchema = {
  type: 'object',
  properties: {
    body: {
      type: 'object',
      properties: {
        bankHolidays: { type: 'string' },
      },
      required: ['bankHolidays']
    }
  },
}

export {
  updateDetailsSchema
}