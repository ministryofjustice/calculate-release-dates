;(function () {
  document.addEventListener(
    'change',
    function (event) {
      // If the clicked element doesn't have the right selector, bail
      if (event.target.id === 'select-all') {
        var checked = event.target.checked
        var checkboxes = document.querySelectorAll('.row-checkbox')
        for (var i = 0; i < checkboxes.length; i++) {
          checkboxes[i].checked = checked
        }
      } else if (event.target.matches('.row-checkbox')) {
        var selectAll = document.getElementById('select-all')
        var checkboxes = document.querySelectorAll('.row-checkbox')
        var allChecked = true
        for (var i = 0; i < checkboxes.length; i++) {
          if (!checkboxes[i].checked) {
            allChecked = false
            break
          }
        }
        selectAll.checked = allChecked
      } else {
        return
      }
    },
    false
  )
})()
