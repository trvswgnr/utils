#ifndef _VEC_H_INCLUDED_
#define _VEC_H_INCLUDED_

#include <stddef.h>
#include <stdbool.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include "rawvec.h"

typedef struct
{
    RawVec buf;
    size_t len;
} Vec;

// Initialize a new Vec
Vec Vec_new()
{
    return (Vec){
        .buf = RawVec_new(GLOBAL_ALLOCATOR),
        .len = 0};
}

// Create a Vec with a given capacity
Vec Vec_with_capacity(size_t capacity, size_t elem_size)
{
    return (Vec){
        .buf = RawVec_with_capacity(capacity, elem_size, GLOBAL_ALLOCATOR),
        .len = 0};
}

// Get the capacity of the Vec
size_t Vec_capacity(const Vec *vec)
{
    return RawVec_capacity(&vec->buf);
}

// Reserve additional capacity
void Vec_reserve(Vec *vec, size_t additional, size_t elem_size)
{
    RawVec_reserve(&vec->buf, vec->len, additional, elem_size);
}

// Push an element to the Vec
void Vec_push(Vec *vec, const void *value, size_t elem_size)
{
    if (vec->len == Vec_capacity(vec))
    {
        RawVec_reserve(&vec->buf, vec->len, 1, elem_size);
    }
    memcpy((char *)vec->buf.ptr + vec->len * elem_size, value, elem_size);
    vec->len++;
}

// Pop an element from the Vec
bool Vec_pop(Vec *vec, void *out, size_t elem_size)
{
    if (vec->len == 0)
    {
        return false;
    }
    vec->len--;
    memcpy(out, (char *)vec->buf.ptr + vec->len * elem_size, elem_size);
    return true;
}

// Get a pointer to the element at the given index
void *Vec_get(const Vec *vec, size_t index, size_t elem_size)
{
    assert(index < vec->len);
    return (char *)vec->buf.ptr + index * elem_size;
}

// Set the element at the given index
void Vec_set(Vec *vec, size_t index, const void *value, size_t elem_size)
{
    assert(index < vec->len);
    memcpy((char *)vec->buf.ptr + index * elem_size, value, elem_size);
}

// Get the length of the Vec
size_t Vec_len(const Vec *vec)
{
    return vec->len;
}

// Check if the Vec is empty
bool Vec_is_empty(const Vec *vec)
{
    return vec->len == 0;
}

// Clear the Vec
void Vec_clear(Vec *vec)
{
    vec->len = 0;
}

// Truncate the Vec to a new length
void Vec_truncate(Vec *vec, size_t new_len)
{
    if (new_len < vec->len)
    {
        vec->len = new_len;
    }
}

// Resize the Vec
void Vec_resize(Vec *vec, size_t new_len, const void *value, size_t elem_size)
{
    if (new_len > vec->len)
    {
        size_t additional = new_len - vec->len;
        Vec_reserve(vec, additional, elem_size);
        for (size_t i = vec->len; i < new_len; i++)
        {
            memcpy((char *)vec->buf.ptr + i * elem_size, value, elem_size);
        }
    }
    vec->len = new_len;
}

// Free the memory used by the Vec
void Vec_drop(Vec *vec)
{
    RawVec_drop(&vec->buf);
    vec->len = 0;
}

// Create a slice from the Vec
void *Vec_as_slice(const Vec *vec)
{
    return vec->buf.ptr;
}

// Create a mutable slice from the Vec
void *Vec_as_mut_slice(Vec *vec)
{
    return vec->buf.ptr;
}

#endif // _VEC_H_INCLUDED_
