;(function($) {

    $(document).ready( function() {
        $(document).on('click', '.header-area .show-menu', function() {
            $(this).toggleClass('active');
            $(".header-area .navbar").toggleClass('active');
        });
        // $(document).on('click', '.header-area .navbar .close-menu', function() {
        //     $(".header-area .navbar").removeClass('active');
        // });

        AOS.init({
            duration: 1500,
            once: true,
        });

        // Auto-update years of experience (from June 2025 graduation)
        var yearsEl = document.getElementById('years-exp');
        if (yearsEl) {
            var gradDate = new Date(2025, 5, 1); // June 2025
            var now = new Date();
            var years = Math.max(1, Math.floor((now - gradDate) / (365.25 * 24 * 60 * 60 * 1000)));
            yearsEl.textContent = years < 10 ? '0' + years : years;
        }
    });

})(jQuery);


var div = document.createElement("div");
    div.id="preloader",
    div.className="preloader",
    div.innerHTML='<div class="black_wall"></div><div class="loader"></div>',
    document.body.insertBefore(div,document.body.firstChild),window.onload=function() {
    document.getElementById("preloader").classList.add("off")
};