;(function () {
  document.addEventListener(
    'change',
    function (event) {
      // If the clicked element doesn't have the right selector, bail
      if (event.target.id === 'unselect-all') {
        var checked = event.target.checked
        if (checked) {
          var checkboxes = document.querySelectorAll('.row-checkbox')
          for (var i = 0; i < checkboxes.length; i++) {
            checkboxes[i].checked = !checked
          }
        }
      } else if (event.target.matches('.row-checkbox')) {
        var unselectAll = document.getElementById('unselect-all')
        var checkboxes = document.querySelectorAll('.row-checkbox')
        var anyChecked = false
        for (var i = 0; i < checkboxes.length; i++) {
          if (checkboxes[i].checked) {
            anyChecked = true
            break
          }
        }
        if (anyChecked) {
          unselectAll.checked = false
        }
      } else {
        return
      }
    },
    false
  )
})()
