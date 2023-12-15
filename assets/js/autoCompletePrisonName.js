window.addEventListener('load', function () {
  accessibleAutocomplete.enhanceSelectElement({
    selectElement: document.querySelector('#prison-name'),
    placeholder: 'Start typing the name of the prison',
  })
})
