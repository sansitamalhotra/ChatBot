export default function initOffCanvas() {
  (function($) {
    'use strict';
    $(document).on('click', '.navbar-toggler', function() {
      $('.navbar-collapse').toggleClass('show');
    });
    $(document).on('click', '[data-toggle="offcanvas"]', function() {
      $('.sidebar-offcanvas').toggleClass('active');
    });
  })(window.jQuery);
}