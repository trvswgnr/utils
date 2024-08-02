#ifndef _STRING_H_INCLUDED_
#define _STRING_H_INCLUDED_

#include <stddef.h>
#include <stdbool.h>
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <assert.h>
#include "vec.h"

typedef struct
{
    Vec vec;
} String;

// Initialize a new String
String String_new()
{
    return (String){
        .vec = Vec_new(GLOBAL_ALLOCATOR)};
}

// Create a String with a given capacity
String String_with_capacity(size_t capacity)
{
    return (String){
        .vec = Vec_with_capacity(capacity, sizeof(char)),
    };
}

// Create a String from a C string
String String_from(const char *s)
{
    size_t len = strlen(s);
    String str = String_with_capacity(len + 1);
    memcpy(str.vec.buf.ptr, s, len + 1);
    str.vec.len = len;
    return str;
}

// Get the length of the String
size_t String_len(const String *s)
{
    return s->vec.len;
}

// Get the capacity of the String
size_t String_capacity(const String *s)
{
    return Vec_capacity(&s->vec);
}

// Check if the String is empty
bool String_is_empty(const String *s)
{
    return s->vec.len == 0;
}

// Append a C string to the String
void String_push_str(String *s, const char *str)
{
    size_t add_len = strlen(str);
    size_t new_len = s->vec.len + add_len;
    Vec_reserve(&s->vec, add_len, sizeof(char));
    memcpy((char *)s->vec.buf.ptr + s->vec.len, str, add_len);
    s->vec.len = new_len;
    ((char *)s->vec.buf.ptr)[new_len] = '\0';
}

// Append a character to the String
void String_push(String *s, char ch)
{
    Vec_reserve(&s->vec, 1, sizeof(char));
    ((char *)s->vec.buf.ptr)[s->vec.len] = ch;
    s->vec.len++;
    ((char *)s->vec.buf.ptr)[s->vec.len] = '\0';
}

// Get a pointer to the underlying C string
const char *String_as_str(const String *s)
{
    return (const char *)s->vec.buf.ptr;
}

// Clear the String
void String_clear(String *s)
{
    s->vec.len = 0;
    if (s->vec.buf.ptr)
    {
        ((char *)s->vec.buf.ptr)[0] = '\0';
    }
}

// Free the memory used by the String
void String_drop(String *s)
{
    Vec_drop(&s->vec);
}

// Truncate the String to a new length
void String_truncate(String *s, size_t new_len)
{
    if (new_len <= s->vec.len)
    {
        s->vec.len = new_len;
        ((char *)s->vec.buf.ptr)[new_len] = '\0';
    }
}

// Remove and return the last character from the String
char String_pop(String *s)
{
    if (s->vec.len == 0)
    {
        return '\0';
    }
    s->vec.len--;
    char ch = ((char *)s->vec.buf.ptr)[s->vec.len];
    ((char *)s->vec.buf.ptr)[s->vec.len] = '\0';
    return ch;
}

// Insert a character at a specific index
void String_insert(String *s, size_t idx, char ch)
{
    assert(idx <= s->vec.len);
    Vec_reserve(&s->vec, 1, sizeof(char));
    memmove((char *)s->vec.buf.ptr + idx + 1, (char *)s->vec.buf.ptr + idx, s->vec.len - idx + 1);
    ((char *)s->vec.buf.ptr)[idx] = ch;
    s->vec.len++;
}

// Insert a C string at a specific index
void String_insert_str(String *s, size_t idx, const char *str)
{
    assert(idx <= s->vec.len);
    size_t insert_len = strlen(str);
    Vec_reserve(&s->vec, insert_len, sizeof(char));
    memmove((char *)s->vec.buf.ptr + idx + insert_len, (char *)s->vec.buf.ptr + idx, s->vec.len - idx + 1);
    memcpy((char *)s->vec.buf.ptr + idx, str, insert_len);
    s->vec.len += insert_len;
}

// Remove a character at a specific index
char String_remove(String *s, size_t idx)
{
    assert(idx < s->vec.len);
    char ch = ((char *)s->vec.buf.ptr)[idx];
    memmove((char *)s->vec.buf.ptr + idx, (char *)s->vec.buf.ptr + idx + 1, s->vec.len - idx);
    s->vec.len--;
    return ch;
}

// Create a new String from a substring
String String_substring(const String *s, size_t start, size_t end)
{
    assert(start <= end && end <= s->vec.len);
    size_t len = end - start;
    String result = String_with_capacity(len + 1);
    memcpy(result.vec.buf.ptr, (char *)s->vec.buf.ptr + start, len);
    ((char *)result.vec.buf.ptr)[len] = '\0';
    result.vec.len = len;
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
    Vec_drop(&s->vec);
}

#endif // _STRING_H_INCLUDED_
