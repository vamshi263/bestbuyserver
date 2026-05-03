const sgMail = require("@sendgrid/mail")
const test = require("node:test")

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendMail = async (to, data, pdfBuffer) => {
    try{
        const attachments = []

        if(pdfBuffer && pdfBuffer.length > 0) {
            attachments.push({
                content: Buffer.from(pdfBuffer).toString("base64"),
                filename: "invoice.pdf",
                type: "application/pdf",
                disposition: "attachment"
            })
        }
        const msg = {
            to,
            from: process.env.USER_EMAIL,
            templateId: "d-32f3541a30de404183de29bc308b45d7",
            dynamic_template_data: data,
            attachments
        }
        await sgMail.send(msg)
        console.log("Email sent successfully")
    }  
    catch(err){
        console.log('Email not sent', err)
    }
} 
module.exports = sendMail

