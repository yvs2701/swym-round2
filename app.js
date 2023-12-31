const express = require("express");
const cors = require("cors");
const multer = require("multer");
const csvToJson = require("csvtojson/v2");
const ical = require("ical-generator");

const PORT = process.env.PORT || 3000;

const app = express();

const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
      const name = file.originalname.toLowerCase().split(' ').join('-');
      cb(null, `${new Date().getTime()}-${name}`)
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype == "text/csv") {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only CSV files alowed!'));
    }
  }
});

app.use(express.static("public"));

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = ["http://localhost:3000",];

    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // dont allow origins not in the allowedOrigins array
    if (!allowedOrigins.includes(origin))
      return callback(
        new Error(
          "The CORS policy for this site does not allow access from the specified Origin."
        ),
        false
      );

    // else
    return callback(null, true);
  }
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.post("/process_csv", upload.single("file") /* same as html name of input */, async (req, res) => {
  console.log(req.file);

  // HANDLE THE EMAIL LOGIC
  const DATA = await csvToJson().fromFile(req.file.path);
  console.log(DATA);

  DATA.forEach((RECORD) => {
    const calendar = ical({ name: RECORD["Topic Description"] });
    const date = RECORD["Date"];
    const time = RECORD["Time"];
    const emails = RECORD["List of Invitees"].split(",");

    calendar.createEvent({
      start: time,
      attendees: emails,
      timezone: 'Asia/Kolkata'
    });

    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_SMTP,
      port: process.env.MAIL_PORT,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD
      },
    })

    transporter.sendMail({
      from: `"${process.env.MAIL_USERNAME}" <${process.env.MAIL_USER}>`,
      to: RECORD["List of Invitees"],
      subject: `Event arrived!`,
      text: `Open to view invite!`,
      icalEvent: calendar.toBlob()
    }).then(() => {
      res.status(200).json({ success: true, message: ("Sent Email to " +  RECORD["List of Invitees"]) })
    }).catch((err) => {
      res.status(500).json({ success: false, message: "Internal Server Error"});
    })
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});