// Import the functions you need from the SDKs you need
import admin from "firebase-admin";
let firebaseAdmin;
if (!admin.apps.length) {
    firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert({
            projectId: "cynoguard-de297",
            privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDIGGZu9OfMLA4d\npfNwL4phDUHqyGYj8xZ3uOWPxze5MC4NNP9Qk5UwpG/DwoX8jequwen3XmTeBXX7\naBXKaXtbsW6DeZ7EOSXx4I6lUWO4bLLp16HBBs9cjZxJ2tlKqDrzb57h2sAUPLDg\niRhIEjODDAaUkLMr6UqgDLCmjyNKtqW7Er4hKhL0IJjY4G5hB9AeTOPhRL9zjQNm\nljPk+2wn/RUkrGQV9gMlQsREKUh7W9aNOVSFRyfC8NuarHzAsiTBWGpl8s7l49it\nW90Uy03UHozVJDWPJ3gg1unko+Nf2MLNgwNUCVYL3lLZyJP3xUuiMbZBAR3g+15f\n15C/mhNlAgMBAAECggEAGk3E13S37QnkkCay5g5F12TGA850yOiJjVL/0IMMkvpf\nr2pGXuoLvHF9ZMNTWEQys+b3cgaVZW9b12ETLkDoD8F3KO7pvVtS3uVZcyeMH6Ag\nc+eeErEpvL277CSKGIuddkd34DJgujhROy8ig0TrQyCnU8vi1dSs8/W/GiIqbkVx\nEW3Rh5H/fz15xlRSDfxTThpWlOKgSvgh8N+Ji3GXr8w3ZrYD4iKQMcxR1a5Tne0O\n5o9Q2I4X2awzG0RteDdWJBhAGEZdquo9HMRw51TpNXC0TpmFspSaW701gorYM//0\nFpupL+jWwCp2iR+rUwyAz6pp5aXUmgVfGM0EXcNe6QKBgQD8GIU9+iubIq1wA94h\nz4KMSHECnYpXwaOClLF9I/CNDUmlzTy7gagIUAeZ+DhtFUn3k5sC+uXZ0tCdtqxi\n7wJ1WpqXOgDSl54ME4zGyB/ttyVuFYaUBVODfNZEl5Dxf3k2I/y8VCIWL/AAcjCG\n08nO2vqQir2wY0QjswogwYhjGQKBgQDLMbbfR6wHpxttH1KfG17wbZ9rd/mxMvF2\nRV99gHIp3MkiuWaXu+iVUvQsOHzdNCxtIH5mdqxw5Zzk7t4XvBqxNWN20UWY3zG7\nyDbgKnz1tYYYKkJ2+fR+vp/70MYrYvUdtJuve2Wk0JiJbw2+3Yx2YIeIAawzsWAp\nVrkQI6LoLQKBgQCOYe8HhT+RvHFG3fhdEk3Cm7uwZXhYflayjvb8HgtkL0gUbCnM\nIbvdDg5tCQQdoDOJsIWRllGxyF7pZN5Sdnnl/Elp9mm2h8nNOlF9iFR4N8PdPC0p\ndySnFCAU16IWtA+q44KAf+hMrcCZD+WWkRHfUlDIyIPAlyBKJXon7AbzKQKBgQDK\nAO19wiILJZ1FectItAxJV6ISVB7eg/e7DbKl8QkOBxnKtKiClmPd968ZOzsfKhw0\njQY8VSSPxCWbDsGqtO2QWLQ+TkQze0hVF/E+H99E4qah5XlYEJx5WIdx75bjUSi/\n1GqmJTXiiSHsF4SByH04vjRfCNKqPV+NGVM38UWmLQKBgQCqlrUO9VImgkXjkwkL\nx8he0fcKT1siKlb/I3rq8DwvK1JNEuba45Ca5NPh+EWy+USJoKFX6W6iHO1AH62G\neXgfGxn9WkW8IbDqTcpeJoLd9bgoMWTA763a/j+2FRwOoRd9mSDm8sXvAXsNi0Up\nEkqdhPRpp9hoUp7UoAcZ5KAIJg==\n-----END PRIVATE KEY-----\n",
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
