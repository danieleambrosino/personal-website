package main

import (
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/gomarkdown/markdown"
)

func main() {
	// Check if a file name has been provided
	if len(os.Args) < 2 {
		fmt.Println("Please provide a Markdown file name as an argument.")
		return
	}

	// Read the contents of the Markdown file
	filename := os.Args[1]
	input, err := os.ReadFile(filename)
	if err != nil {
		fmt.Println(err)
		return
	}

	// Convert Markdown to HTML
	output := markdown.ToHTML(input, nil, nil)

	// Create a public directory if it doesn't exist
	err = os.MkdirAll("public", 0755)
	if err != nil {
		fmt.Println(err)
		return
	}

	// Determine the output directory and file name
	basename, extension := filepath.Base(filename), filepath.Ext(filename)
	outputDir, outputName := getOutputPath(basename, extension)

	// Save the output to a file in the public directory
	htmlFilename := filepath.Join("public", outputDir, outputName+".html")
	err = os.WriteFile(htmlFilename, output, fs.FileMode(0644))
	if err != nil {
		fmt.Println(err)
		return
	}

	fmt.Printf("Successfully converted %s to %s\n", filename, htmlFilename)
}

// getOutputPath returns the output directory and file name for the given input file name
// and extension, based on its format. If the input file name is in the form YYYY-MM-DD-whatever.md,
// it is converted to YYYY/YY/DD/whatever.html, otherwise it is converted to whatever.html.
func getOutputPath(filename, ext string) (string, string) {
	pattern := `^(\d{4})-(\d{2})-(\d{2})-(.+)\.md$`
	re := regexp.MustCompile(pattern)
	matches := re.FindStringSubmatch(filename)
	if len(matches) == 5 {
		// The input file name is in the form YYYY-MM-DD-whatever.md
		year := matches[1]
		month := matches[2]
		day := matches[3]
		name := matches[4]
		dir := filepath.Join(year, month, day)
		os.MkdirAll(filepath.Join("public", dir), 0755)
		return dir, name
	} else {
		// The input file name is not in the expected format
		name := strings.TrimSuffix(filename, ext)
		return "", name
	}
}
