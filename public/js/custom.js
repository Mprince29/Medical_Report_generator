// to get current year
function getYear() {
    var currentDate = new Date();
    var currentYear = currentDate.getFullYear();
    document.querySelector("#displayYear").innerHTML = currentYear;
}

getYear();

// nice select
$(document).ready(function () {
    $('select').niceSelect();

    // Smooth scrolling for navigation links
    $('.nav-link').on('click', function (event) {
        event.preventDefault();
        var target = $(this).attr('href');
        if (target.startsWith('#')) {
            $('html, body').animate({
                scrollTop: $(target).offset().top
            }, 800);
        }
    });
});

// date picker
$(function () {
    $("#inputDate").datepicker({
        autoclose: true,
        todayHighlight: true
    }).datepicker('update', new Date());
});

// owl carousel slider js
$('.team_carousel').owlCarousel({
    loop: true,
    margin: 15,
    dots: true,
    autoplay: true,
    navText: [
        '<i class="fa fa-angle-left" aria-hidden="true"></i>',
        '<i class="fa fa-angle-right" aria-hidden="true"></i>'
    ],
    autoplayHoverPause: true,
    responsive: {
        0: {
            items: 1,
            margin: 0
        },
        576: {
            items: 2,
        },
        992: {
            items: 3
        }
    }
});

document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".nav-link").forEach(anchor => {
        anchor.addEventListener("click", function (event) {
            let text = this.innerText.trim().toLowerCase();

            let sectionId;
            if (text.includes("home")) {
                sectionId = "home";
            } else if (text.includes("about")) {
                sectionId = "about";
            } else if (text.includes("tests")) {
                sectionId = "tests";
            } else if (text.includes("contact")) {
                sectionId = "contact";
            }

            if (sectionId) {
                event.preventDefault();
                const targetElement = document.getElementById(sectionId);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 50, // Adjust if header is fixed
                        behavior: "smooth"
                    });
                }
            }
        });
    });
});
