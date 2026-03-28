// Import the functions you need from the SDKs you need
import admin from "firebase-admin";
let firebaseAdmin;
if (!admin.apps.length) {
    firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert({
            projectId: "cynoguard-de297",
            privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC0lBHSb2ruVMIQ\ndoXoLTSGAJ+nNSgek/ytPKuUt3/4z4fufsN77tAptEExn6GUoykbXiEZXZGMYsjf\nXRNP2Ep+JaXyHGBf3WauUUVQXKLqDEt+/XwvBW7/Lyy3iRPf04yeA51rBtcTtE74\n9JJAzUR1h1AkmYbqIKTFaDjJjxbiIC3C0ZGJYq4E7zhL54ZhIIXtSXDzPujEtnrY\nfijj9WMLTBXzeGOxcjDG13C/pxurnWaPdb4Rv82CK3fJbrh41T8E/oz1lNWF3KUp\nVE2heQReNAiS/1BGkly2fqHQVG+6mINhOBywC/KgIsyH80AbOXJcj/P3ushQJhxb\nSoGoG2OrAgMBAAECggEAF35eNTkuudRILVkmQddDyp1hKCF310acrLNEhYQ8P5RM\nlKBkcYbYCVz80GZ64Lo7mmZsOv8b9R5TERBsd0pmIrRmOzIq7b4B4nMLaBGtVnME\nDYEQO5Pi5YtvL2/DqK6+0D4bKHYK3HLshWJYdtrd6caRjDl3PpXBqjdNkBewO/oI\nx01sYfuK+oWyocWdfItQS0fB2ebWNq4VQ1PgknaSNfuHXgCQ4i+2m/ONU7VlrxXT\nKrWvGGu1dr5RjShEOuc36bovMNWIp+rw8ZPG9uRbTwoN7b9aYOQIbJfhOe2GAxmF\n2GvO0tGxFq7jdGyS8DTHF7syd6TeMOQ4DkRE1P7aMQKBgQDhkjJW0gVe5tWrhVKk\naP/KdYtHP4+Kj+XheuxghZnBfKqG9K6FFwrTD64CFQeDIISW9xaj0hmJsL6Sx2kb\nrmuExbHqbrj1G5+VBtEGRlWmricwSLYvoggBEJbkdL9OrvUUOiHrCUpUGSN6YcdX\nVcUOtycF0GKNyFTr24AwGddkGwKBgQDM8Bv5REUBeTPU0b47qUps7+Hq5t7RSbe5\n0v1BuwXY3/WCo7KW3j19GcVeamkHyG+OzWIn5DO93gMQ44Xg6P543x1KFyXPpeS0\n2J30LzA10aLcaM/IFFpHsXxCT1rxvSeOf9z5zYgrx3mDvUvy9MBEGwkOvAstSDqa\n/rEzVB5XsQKBgHx6tzjeMYSLkkJTEqYUI4RQlYm987KdcliaAzPIxm7WIyzSfjSH\n4LtUncwcWsbr/P9qX54L5Xfsh15smP5jpIXiqyoZ7AunMMuGtXbm/YE7/fhRR+jF\nW/FqfDqairAbMLf21JzlxZTfQorYxq7VcCeMvwYgVyKy+NoniXgB6rEdAoGAfF9X\nyr4Y1t0UjJrBxXlnFpe6VpHINeF0I80dL6/ty4GXgLIR5yd2z549PqB7n2KP+W1B\nnY4LrLW4zJ4YGLet//L/1oAXzV4TX4F60r90laTlHrhpKTbY11uqWp/IRJ8UC5Ij\nrGKEunTzlPTjy82nhW2W4J9UdSW5k2jwZ4MsavECgYEA0BzZZYKuvgfaVYLyF1M2\nVTu6I32C20JgIWt5TBFfr37AUByBJOZxcONmjlCYUIo+z3o4EEG9xsvjt4X63j+l\nz3/T3XQe975tdrK1OvRPKN6AMxZE9vz/jqnwsDRCloSEsgJv5MIkOKQh+b3suyq8\nbjqyvuHWf+Or13b9kbujGNQ=\n-----END PRIVATE KEY-----\n",
            clientEmail: "firebase-adminsdk-fbsvc@cynoguard-de297.iam.gserviceaccount.com"
        }),
    });
}
else {
    firebaseAdmin = admin.app();
}
// Initialize Firebase
export const auth = firebaseAdmin.auth();
export default firebaseAdmin;
