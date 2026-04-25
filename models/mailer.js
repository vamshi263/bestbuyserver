const nodemailer = require('nodemailer');
console.log("Mailer running")
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "vamshink263@gmail.com",
        pass: "flcuwcpihfvrkwmj"
    }
});

async function sendMail(email, subject, html,attachment){ {
    try{
        await transporter.sendMail({
        from: '"BestBuy" <vamshink263@gmail.com>',
        to: email,
        subject,
        html,
        attachments: attachment ? [
                {
                    filename: "invoice.pdf",
                    content: attachment
                }
            ] : []
    })
    console.log("Email sent")
    } catch(err){
        console.log(err)
      }
}
}

module.exports = sendMail

