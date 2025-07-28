import React, { useEffect } from 'react';
import WOW from 'wowjs';
import $ from 'jquery';
import 'owl.carousel';

const CustomScript = () => {
  useEffect(() => {
    // Spinner
    var spinner = function () {
        setTimeout(function () {
            if ($('#spinner').length > 0) {
                $('#spinner').removeClass('show');
            }
        }, 1);
    };
    spinner();

    // Initiate the wowjs
    new WOW.WOW().init();

    // Back to top button
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
        });
        $('.back-to-top').click(function () {
            $('html, body').animate({scrollTop: 0}, 1500, 'easeInOutExpo');
            return false;
    });

    // Team carousel
    
  

    // Fact Counter
    $(document).ready(() => {
      $('.counter-value').each(function () {
        $(this).prop('Counter', 0).animate({
          Counter: $(this).text()
        }, {
          duration: 2000,
          easing: 'easeInQuad',
          step: function (now) {
            $(this).text(Math.ceil(now));
          }
        });
      });
    });
  }, []);
};

export default CustomScript;
