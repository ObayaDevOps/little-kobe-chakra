import nodemailer from "nodemailer"

//make this a promise: https://stackoverflow.com/questions/60684227/api-resolved-without-sending-a-response-in-nextjs
export default async (req, res) => {
  const { Name, Email, PhoneNumber, Message } = req.body;
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });

  //TODO: ADD 
    //products description
    // price
    // delivery address
    // paymentId (to follow up) 
    //Any other delivery notes [Create additional field in form]


const data={ from: Email,
    to: process.env.RECIPIENT_ADDRESS,
    subject: `Little Kobe New Contact Form submission from ${Name}`,
      html: `<h1>${Name} Has sent a message to you</h1>
      <p>You have a contact form submission</p><br>
        <p><strong>Email: </strong> ${Email}</p><br>
        <p><strong>Email: </strong> ${PhoneNumber}</p><br>
        <p><strong>Message: </strong> ${Message}</p><br>
      `}

      transporter.sendMail(data, function (err, info) {
        if(err){
            console.log(err)
            console.log("DID NOT SEND !")


        }
        else
        console.log("INFO SEND !") // at this point, tell the user message has successfully sent
        //toast
        //chakra tenplate modal ?

          console.log(info)
          res.send("success!!")
      })
};