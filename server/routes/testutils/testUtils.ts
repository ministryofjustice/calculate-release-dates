/*
    This util will remove any line breaks or any text with more than one space. 
    It is useful when trying to assert content from a HTML response, where the content
    has been split over multiple lines in the HTML template file.
*/
export default (res: { text: string }): void => {
  res.text = res.text.replace(/\n/g, '').replace(/(\s){2,}/g, ' ')
}
