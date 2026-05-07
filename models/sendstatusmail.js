const sgMail = require("@sendgrid/mail")

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendStatusMail = async (to, data) => {

    try {

        const msg = {

            to,

            from: process.env.USER_EMAIL,

            templateId: "PASTE_YOUR_TEMPLATE_ID_HERE",

            dynamic_template_data: data

        }

        await sgMail.send(msg)

        console.log("Status email sent successfully")

    }

    catch(err) {

        console.log(
            "Status email failed",
            err.response?.body || err
        )

    }

}

module.exports = sendStatusMail