interface ErrorMessage {
  /* link for the error */
  href?: string
  /* Html for the error */
  html?: string
  /* Id of the html element to tie the error to. */
  id?: string
  /* Text to display */
  text?: string
  /* Fix source to display */
  fixSource?: FixSource
}

export enum FixSource {
  ADJUSTMENTS = 'ADJUSTMENTS',
  ADJUDICATIONS = 'ADJUDICATIONS',
  COURT_CASES = 'COURT_CASES',
  RECALLS = 'RECALLS',
}

export default ErrorMessage
