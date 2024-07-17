package main

import (
	"io"
	"log"
	"net/http"

	"github.com/fiorix/go-smpp/smpp"
	"github.com/fiorix/go-smpp/smpp/pdu/pdufield"
	"github.com/fiorix/go-smpp/smpp/pdu/pdutext"
	"github.com/fiorix/go-smpp/smpp/pdu/pdutlv"
)

func main() {
	// make persistent connection
	tx := &smpp.Transmitter{
		Addr:   "localhost:2775",
		User:   "YOUR_SYSTEM_ID",
		Passwd: "YOUR_PASSWORD",
	}
	conn := tx.Bind()
	// check initial connection status
	var status smpp.ConnStatus
	if status = <-conn; status.Error() != nil {
		log.Fatalln("Unable to connect, aborting:", status.Error())
	}
	log.Println("Connection completed, status:", status.Status().String())
	// example of connection checker goroutine
	go func() {
		for c := range conn {
			log.Println("SMPP connection status:", c.Status())
		}
	}()
	// example of sender handler func
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		sm, err := tx.Submit(&smpp.ShortMessage{
			Src:      r.FormValue("src"),
			Dst:      r.FormValue("dst"),
			Text:     pdutext.Raw(r.FormValue("text")),
			Register: pdufield.NoDeliveryReceipt,
			TLVFields: pdutlv.Fields{
				pdutlv.TagReceiptedMessageID: pdutlv.CString(r.FormValue("msgId")),
			},
		})
		if err == smpp.ErrNotConnected {
			http.Error(w, "Oops.", http.StatusServiceUnavailable)
			return
		}
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		io.WriteString(w, sm.RespID())
	})
	log.Fatal(http.ListenAndServe(":8000", nil))
}
