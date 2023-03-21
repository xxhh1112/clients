# We need to generate two certificates to make browsers happy.
#
# Certificate Authority used to sign the server certificate.
# Server certificate used by the server.
#
# The CA is added to the users trust.

$caParams = @{
    'KeyAlgorithm'      = 'RSA';
    'KeyLength'         = 4096;
    'KeyUsage'          = 'CertSign';
    'NotAfter'          = (Get-Date).AddYears(10);
    'DnsName'           = "Bitwarden Web Vault - CA";
    'CertStoreLocation' = 'Cert:\CurrentUser\My';
};

$cert = New-SelfSignedCertificate @caParams;

$caLocation = $pwd.Path + './ca.crt';

# Need to reimport it from the users store to root.
Export-Certificate -Cert $cert -FilePath $caLocation

Import-Certificate -FilePath $caLocation -CertStoreLocation Cert:\CurrentUser\Root

# Server certificate
$params = @{
    'NotAfter'          = (Get-Date).AddYears(10);
    'DnsName'           = "localhost", "127.0.0.1", "bitwarden.test";
    'CertStoreLocation' = 'Cert:\CurrentUser\My';
    'Signer'            = $cert;
};

$cert = New-SelfSignedCertificate @params;

# Windows lack built in support for exporting passwordless pfx
$certBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Pfx)
[System.IO.File]::WriteAllBytes($pwd.Path + './dev-cert.pfx', $certBytes)
