source = ["./bw"]
bundle_id = "com.bitwarden.bwcli"

apple_id {
  username = "mmartin@bitwarden.com"
  password = "@env:APPLE_ID_PASSWORD"
}

sign {
  application_identity = "Developer ID Application: 8bit Solutions LLC"
}

dmg {
  output_path = "bw.dmg"
  volume_name = "bw"
}

zip {
  output_path = "bw.zip"
}