(function ($) {
    'use strict';
    var form = $('.contact-form form'),
        message = $('.messenger-box-contact__msg'),
        form_data;

    // Success function
    function done_func(response) {
        message.fadeIn().removeClass('alert-danger').addClass('alert-success');
        message.text(response.message || 'Your message was sent successfully.');
        setTimeout(function () {
            message.fadeOut();
        }, 3000);
        form.find('input:not([type="submit"]):not([type="hidden"]), textarea').val('');
    }

    // Fail function
    function fail_func(data) {
        message.fadeIn().removeClass('alert-success').addClass('alert-danger');
        message.text(data.responseJSON ? data.responseJSON.message : 'Something went wrong. Please try again.');
        setTimeout(function () {
            message.fadeOut();
        }, 3000);
    }

    form.submit(function (e) {
        e.preventDefault();

        const fullName = document.getElementById("full-name");
        const email = document.getElementById("email");

        if (!fullName.value || !email.value) {
            if (!fullName.value) fullName.classList.add("invalid");
            if (!email.value) email.classList.add("invalid");
            return false;
        }

        form_data = $(this).serialize();
        $.ajax({
            type: 'POST',
            url: form.attr('action'),
            data: form_data,
            dataType: 'json'
        })
        .done(done_func)
        .fail(fail_func);
    });

})(jQuery);
