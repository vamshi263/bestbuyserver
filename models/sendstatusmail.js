const sgMail = require("@sendgrid/mail")

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendStatusMail = async (to, data) => {

    try {

        const msg = {

            to,

            from: process.env.USER_EMAIL,

            templateId: "d-382c6ae2e2464a40a1e69dd973710c35",

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