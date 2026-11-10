const comparePaths = {
  COMPARE_INDEX: '/compare',
  COMPARE_MANUAL: '/compare/manual',
  COMPARE_CHOOSE: '/compare/choose',
  COMPARE_RUN: '/compare/run',
  COMPARE_MANUAL_LIST: '/compare/manual/list',
  COMPARE_LIST: '/compare/list',
  COMPARE_LIST_OTHERS: '/compare/list/others',
  COMPARE_RESULT: '/compare/result/:bulkComparisonResultId',
  COMPARE_DETAIL: '/compare/result/:bulkComparisonResultId/detail/:bulkComparisonDetailId',
  COMPARE_DETAIL_JSON: '/compare/result/:bulkComparisonResultId/detail/:bulkComparisonDetailId/json',
  COMPARE_MANUAL_RESULT: '/compare/manual/result/:bulkComparisonResultId',
  COMPARE_MANUAL_DETAIL: '/compare/manual/result/:bulkComparisonResultId/detail/:bulkComparisonDetailId',
  COMPARE_MANUAL_DETAIL_JSON: '/compare/manual/result/:bulkComparisonResultId/detail/:bulkComparisonDetailId/json',
  UNUSED_DEDUCTIONS_INDEX: '/compare/unused-deductions',
  UNUSED_DEDUCTIONS_LIST: '/compare/unused-deductions/list',
  UNUSED_DEDUCTIONS_RUN: '/compare/unused-deductions/run',
  UNUSED_DEDUCTIONS_RESULT: '/compare/unused-deductions/result/:comparisonId',
  UNUSED_DEDUCTIONS_DETAIL: '/compare/unused-deductions/result/:comparisonId/detail/:personId',
}

export default comparePaths
