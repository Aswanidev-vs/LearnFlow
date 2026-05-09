package pdf

import (
	"fmt"
	"github.com/johnfercher/maroto/v2"
	"github.com/johnfercher/maroto/v2/pkg/components/code"
	"github.com/johnfercher/maroto/v2/pkg/components/col"
	"github.com/johnfercher/maroto/v2/pkg/components/row"
	"github.com/johnfercher/maroto/v2/pkg/components/text"
	"github.com/johnfercher/maroto/v2/pkg/config"
	"github.com/johnfercher/maroto/v2/pkg/consts/align"
	"github.com/johnfercher/maroto/v2/pkg/consts/fontstyle"
	"github.com/johnfercher/maroto/v2/pkg/props"
	"time"
)

type CertificateData struct {
	UserName    string
	CourseName  string
	IssueDate   time.Time
	CredentialID string
}

func GenerateCertificate(data CertificateData) ([]byte, error) {
	cfg := config.NewBuilder().
		Build()

	m := maroto.New(cfg)

	// Header - Brand
	m.AddRows(
		row.New(20).Add(
			col.New(12).Add(
				text.New("LearnFlow", props.Text{
					Size:  24,
					Style: fontstyle.Bold,
					Align: align.Center,
					Color: &props.Color{Red: 99, Green: 102, Blue: 241}, // #6366f1
				}),
			),
		),
	)

	// Main Title
	m.AddRows(
		row.New(40).Add(
			col.New(12).Add(
				text.New("CERTIFICATE OF COMPLETION", props.Text{
					Size:  32,
					Style: fontstyle.Bold,
					Align: align.Center,
					Top:   10,
				}),
			),
		),
	)

	// Achievement Text
	m.AddRows(
		row.New(20).Add(
			col.New(12).Add(
				text.New("This is to certify that", props.Text{
					Size:  14,
					Align: align.Center,
				}),
			),
		),
	)

	// User Name
	m.AddRows(
		row.New(30).Add(
			col.New(12).Add(
				text.New(data.UserName, props.Text{
					Size:  28,
					Style: fontstyle.BoldItalic,
					Align: align.Center,
					Color: &props.Color{Red: 30, Green: 41, Blue: 59},
				}),
			),
		),
	)

	// Course Info
	m.AddRows(
		row.New(20).Add(
			col.New(12).Add(
				text.New(fmt.Sprintf("has successfully completed the course requirements for"), props.Text{
					Size:  14,
					Align: align.Center,
				}),
			),
		),
	)

	m.AddRows(
		row.New(30).Add(
			col.New(12).Add(
				text.New(data.CourseName, props.Text{
					Size:  20,
					Style: fontstyle.Bold,
					Align: align.Center,
					Color: &props.Color{Red: 99, Green: 102, Blue: 241},
				}),
			),
		),
	)

	// Footer - Credential & QR
	m.AddRows(
		row.New(60).Add(
			col.New(8).Add(
				text.New(fmt.Sprintf("Credential ID: %s", data.CredentialID), props.Text{
					Size: 10,
					Top:  40,
				}),
				text.New(fmt.Sprintf("Issued on: %s", data.IssueDate.Format("January 02, 2006")), props.Text{
					Size: 10,
					Top:  52,
				}),
			),
			col.New(4).Add(
				code.NewQr(fmt.Sprintf("https://learnflow.app/verify/%s", data.CredentialID), props.Rect{
					Percent: 100,
					Center:  true,
				}),
			),
		),
	)

	doc, err := m.Generate()
	if err != nil {
		return nil, err
	}

	return doc.GetBytes(), nil
}
