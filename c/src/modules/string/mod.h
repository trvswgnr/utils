#include <stddef.h>
#include <stdbool.h>
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <assert.h>
#include "../vec/raw.h"


typedef struct
{
    RawVec vec;
    size_t len;
} String;

// Initialize a new String
String String_new(Allocator alloc)
{
    return (String){
        .vec = RawVec_new(alloc),
        .len = 0};
}

// Create a String with a given capacity
String String_with_capacity(size_t capacity, Allocator alloc)
{
    return (String){
        .vec = RawVec_with_capacity(capacity, sizeof(char), alloc),
        .len = 0};
}

// Create a String from a C string
String String_from(const char *s, Allocator alloc)
{
    size_t len = strlen(s);
    String str = String_with_capacity(len + 1, alloc);
    memcpy(str.vec.ptr, s, len + 1);
    str.len = len;
    return str;
}

// Get the length of the String
size_t String_len(const String *s)
{
    return s->len;
}

// Get the capacity of the String
size_t String_capacity(const String *s)
{
    return RawVec_capacity(&s->vec, sizeof(char));
}

// Check if the String is empty
bool String_is_empty(const String *s)
{
    return s->len == 0;
}

// Append a C string to the String
void String_push_str(String *s, const char *str)
{
    size_t add_len = strlen(str);
    size_t new_len = s->len + add_len;
    RawVec_reserve(&s->vec, s->len, add_len, sizeof(char));
    memcpy((char *)s->vec.ptr + s->len, str, add_len);
    s->len = new_len;
    ((char *)s->vec.ptr)[new_len] = '\0';
}

// Append a character to the String
void String_push(String *s, char ch)
{
    RawVec_reserve(&s->vec, s->len, 1, sizeof(char));
    ((char *)s->vec.ptr)[s->len] = ch;
    s->len++;
    ((char *)s->vec.ptr)[s->len] = '\0';
}

// Get a pointer to the underlying C string
const char *String_as_str(const String *s)
{
    return (const char *)s->vec.ptr;
}

// Clear the String
void String_clear(String *s)
{
    s->len = 0;
    if (s->vec.ptr)
    {
        ((char *)s->vec.ptr)[0] = '\0';
    }
}

// Free the memory used by the String
void String_drop(String *s)
{
    RawVec_drop(&s->vec);
    s->len = 0;
}

// Truncate the String to a new length
void String_truncate(String *s, size_t new_len)
{
    if (new_len <= s->len)
    {
        s->len = new_len;
        ((char *)s->vec.ptr)[new_len] = '\0';
    }
}

// Remove and return the last character from the String
char String_pop(String *s)
{
    if (s->len == 0)
    {
        return '\0';
    }
    s->len--;
    char ch = ((char *)s->vec.ptr)[s->len];
    ((char *)s->vec.ptr)[s->len] = '\0';
    return ch;
}

// Insert a character at a specific index
void String_insert(String *s, size_t idx, char ch)
{
    assert(idx <= s->len);
    RawVec_reserve(&s->vec, s->len, 1, sizeof(char));
    memmove((char *)s->vec.ptr + idx + 1, (char *)s->vec.ptr + idx, s->len - idx + 1);
    ((char *)s->vec.ptr)[idx] = ch;
    s->len++;
}

// Insert a C string at a specific index
void String_insert_str(String *s, size_t idx, const char *str)
{
    assert(idx <= s->len);
    size_t insert_len = strlen(str);
    RawVec_reserve(&s->vec, s->len, insert_len, sizeof(char));
    memmove((char *)s->vec.ptr + idx + insert_len, (char *)s->vec.ptr + idx, s->len - idx + 1);
    memcpy((char *)s->vec.ptr + idx, str, insert_len);
    s->len += insert_len;
}

// Remove a character at a specific index
char String_remove(String *s, size_t idx)
{
    assert(idx < s->len);
    char ch = ((char *)s->vec.ptr)[idx];
    memmove((char *)s->vec.ptr + idx, (char *)s->vec.ptr + idx + 1, s->len - idx);
    s->len--;
    return ch;
}

// Create a new String from a substring
String String_substring(const String *s, size_t start, size_t end)
{
    assert(start <= end && end <= s->len);
    size_t len = end - start;
    String result = String_with_capacity(len + 1, s->vec.alloc);
    memcpy(result.vec.ptr, (char *)s->vec.ptr + start, len);
    ((char *)result.vec.ptr)[len] = '\0';
    result.len = len;
    return result;
}

// Compare two Strings
int String_compare(const String *s1, const String *s2)
{
    return strcmp(String_as_str(s1), String_as_str(s2));
}

// Check if two Strings are equal
bool String_equals(const String *s1, const String *s2)
{
    return String_compare(s1, s2) == 0;
}

void String_free(String *s)
{
    RawVec_drop(&s->vec);
    s->len = 0;
}