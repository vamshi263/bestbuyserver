const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: "gmail",
    secure: true,
    auth: {
        user: "vamshink263@gmail.com",
        pass: "flcuwcpihfvrkwmj"
    }
});

async function sendMail(email, subject, html){ {
    try{
        await transporter.sendMail({
        from: '"BestBuy" <vamshink263@gmail.com>',
        to: email,
        subject,
        html
    })
    console.log("Email sent")
    } catch(err){
        console.log(err)
      }
}
}

module.exports = sendMail

