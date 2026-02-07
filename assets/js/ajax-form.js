(function ($) {
    'use strict';
    var form = $('.contact-form form'),
        message = $('.messenger-box-contact__msg');

    form.submit(function (e) {
        e.preventDefault();

        var fullName = document.getElementById("full-name");
        var email = document.getElementById("email");

        if (!fullName.value || !email.value) {
            if (!fullName.value) fullName.classList.add("invalid");
            if (!email.value) email.classList.add("invalid");
            return false;
        }

        var formData = new FormData(this);
        var object = {};
        formData.forEach(function (value, key) {
            object[key] = value;
        });

        fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(object)
        })
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (data.success) {
                message.fadeIn().removeClass('alert-danger').addClass('alert-success');
                message.text(data.message || 'Your message was sent successfully.');
                form.find('input:not([type="submit"]):not([type="hidden"]), textarea').val('');
            } else {
                message.fadeIn().removeClass('alert-success').addClass('alert-danger');
                message.text(data.message || 'Something went wrong. Please try again.');
            }
            setTimeout(function () { message.fadeOut(); }, 3000);
        })
        .catch(function () {
            message.fadeIn().removeClass('alert-success').addClass('alert-danger');
            message.text('Something went wrong. Please try again.');
            setTimeout(function () { message.fadeOut(); }, 3000);
        });
    });

})(jQuery);
