#include <stdio.h>
#include "./mod.h"

void *malloc_wrapper(size_t size)
{
    return malloc(size);
}

void free_wrapper(void *ptr)
{
    free(ptr);
}

void *realloc_wrapper(void *ptr, size_t old_size, size_t new_size)
{
    (void)old_size; // Unused parameter
    return realloc(ptr, new_size);
}

Allocator allocator = {
    .allocate = malloc_wrapper,
    .deallocate = free_wrapper,
    .reallocate = realloc_wrapper};

int main()
{
    // Create a new empty String
    String s1 = String_new(allocator);
    printf("Is s1 empty? %s\n", String_is_empty(&s1) ? "Yes" : "No");

    // Create a String with initial capacity
    String s2 = String_with_capacity(10, allocator);
    printf("s2 capacity: %zu\n", s2);

    // Create a String from a C string
    String s3 = String_from("Hello, ", allocator);
    printf("s3 content: %s\n", s3);
    printf("s3 length: %zu\n", s3.len);

    // Append to the String
    String_push_str(&s3, "world!");
    printf("s3 after push: %s\n", s3);
    printf("s3 new length: %zu\n", s3.len);

    // Clear the String
    String_clear(&s3);
    printf("Is s3 empty after clear? %s\n", String_is_empty(&s3) ? "Yes" : "No");

    // Free the memory
    String_free(&s1);
    String_free(&s2);
    String_free(&s3);

    return 0;
}