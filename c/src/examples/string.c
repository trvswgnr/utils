#include <stdio.h>
#include "../modules/string.h"

int main()
{
    // Create a new empty String
    String s1 = String_new();
    printf("Is s1 empty? %s\n", String_is_empty(&s1) ? "Yes" : "No");

    // Create a String with initial capacity
    String s2 = String_with_capacity(10);
    printf("s2 capacity: %zu\n", s2);

    // Create a String from a C string
    String s3 = String_from("Hello, ");
    printf("s3 content: %s\n", s3);
    printf("s3 length: %zu\n", String_len(&s3));

    // Append to the String
    String_push_str(&s3, "world!");
    printf("s3 after push: %s\n", s3);
    printf("s3 new length: %zu\n", String_len(&s3));

    // Clear the String
    String_clear(&s3);
    printf("Is s3 empty after clear? %s\n", String_is_empty(&s3) ? "Yes" : "No");

    // Free the memory
    String_free(&s1);
    String_free(&s2);
    String_free(&s3);

    return 0;
}