interface ErrorMessage {
  /* link for the error */
  href?: string
  /* Html for the error */
  html?: string
  /* Id of the html element to tie the error to. */
  id?: string
  /* Text to display */
  text: string
}

export default ErrorMessage
