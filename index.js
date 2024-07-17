var smpp = require("smpp");
var experss = require("express");

var server = smpp.createServer(
  {
    debug: true,
  },
  function (session) {
    session.on("error", function (err) {
      // Something ocurred, not listening for this event will terminate the program
      if (e.code === "ETIMEOUT") {
        // TIMEOUT
      } else if (e.code === "ECONNREFUSED") {
        // CONNECTION REFUSED
      } else {
        // OTHER ERROR
      }
    });
    session.on("bind_transceiver", function (pdu) {
      console.log(pdu);

      // we pause the session to prevent further incoming pdu events,
      // untill we authorize the session with some async operation.
      session.pause();

      if (
        pdu.system_id === "YOUR_SYSTEM_ID" &&
        pdu.password === "YOUR_PASSWORD"
      ) {
        // console.log("session", session);

        session.send(pdu.response());
        session.resume();
      } else {
        session.send(
          pdu.response({
            command_status: smpp.ESME_RBINDFAIL,
          })
        );
        session.close();
        return;
      }
    });
  }
);

const app = experss();

app.get("/test", (req, res) => {
  var session = smpp.connect(
    {
      url: "smpp://localhost:2775",
      auto_enquire_link_period: 10000,
      debug: true,
    },
    function () {
      session.bind_transceiver(
        {
          system_id: "YOUR_SYSTEM_ID",
          password: "YOUR_PASSWORD",
        },
        function (pdu) {
          if (pdu.command_status === 0) {
            // Successfully bound
            session.submit_sm(
              {
                destination_addr: "DESTINATION NUMBER",
                short_message: "Hello!",
              },
              function (pdu) {
                if (pdu.command_status === 0) {
                  // Message successfully sent
                  console.log(pdu.message_id);
                }
              }
            );
          }
        }
      );
    }
  );
});

server.listen(2775, () => {
  console.log("listening to port http://localhost:2775");
});

app.listen(5000, () => {
  console.log("listening to port http://localhost:5000");
});
