#include <stddef.h>
#include <stdbool.h>
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <assert.h>
#include "alloc.h"

#ifndef _RAWVEC_H_INCLUDED_
#define _RAWVEC_H_INCLUDED_

#define define_RawVec_of(T)                                                                      \
    typedef struct                                                                               \
    {                                                                                            \
        T *ptr;                                                                                  \
        size_t cap;                                                                              \
        Allocator alloc;                                                                         \
    } RawVec_of_##T;                                                                             \
    RawVec_of_##T RawVec_new(Allocator alloc)                                                    \
    {                                                                                            \
        return (RawVec_of_##T){                                                                  \
            .ptr = NULL,                                                                         \
            .cap = 0,                                                                            \
            .alloc = alloc};                                                                     \
    }                                                                                            \
    RawVec_of_##T RawVec_with_capacity(size_t capacity, size_t elem_size, Allocator alloc)       \
    {                                                                                            \
        void *ptr = NULL;                                                                        \
        if (capacity > 0)                                                                        \
        {                                                                                        \
            ptr = alloc.allocate(capacity * elem_size);                                          \
            assert(ptr != NULL);                                                                 \
        }                                                                                        \
        return (RawVec_of_##T){                                                                  \
            .ptr = ptr,                                                                          \
            .cap = capacity,                                                                     \
            .alloc = alloc};                                                                     \
    }                                                                                            \
    size_t RawVec_capacity(const RawVec_of_##T *vec, size_t elem_size)                           \
    {                                                                                            \
        return vec->cap;                                                                         \
    }                                                                                            \
    void RawVec_grow(RawVec_of_##T *vec, size_t needed_cap, size_t elem_size)                    \
    {                                                                                            \
        size_t new_cap = vec->cap == 0 ? 1 : vec->cap * 2;                                       \
        while (new_cap < needed_cap)                                                             \
        {                                                                                        \
            new_cap *= 2;                                                                        \
        }                                                                                        \
        size_t new_size = new_cap * elem_size;                                                   \
        void *new_ptr;                                                                           \
        if (vec->ptr == NULL)                                                                    \
        {                                                                                        \
            new_ptr = vec->alloc.allocate(new_size);                                             \
        }                                                                                        \
        else                                                                                     \
        {                                                                                        \
            new_ptr = vec->alloc.reallocate(vec->ptr, vec->cap * elem_size, new_size);           \
        }                                                                                        \
        assert(new_ptr != NULL);                                                                 \
        vec->ptr = new_ptr;                                                                      \
        vec->cap = new_cap;                                                                      \
    }                                                                                            \
    void RawVec_reserve(RawVec_of_##T *vec, size_t len, size_t additional, size_t elem_size)     \
    {                                                                                            \
        size_t needed_cap = len + additional;                                                    \
        if (needed_cap > vec->cap)                                                               \
        {                                                                                        \
            RawVec_grow(vec, needed_cap, elem_size);                                             \
        }                                                                                        \
    }                                                                                            \
    void RawVec_drop(RawVec_of_##T *vec)                                                         \
    {                                                                                            \
        if (vec->ptr != NULL)                                                                    \
        {                                                                                        \
            vec->alloc.deallocate(vec->ptr);                                                     \
            vec->ptr = NULL;                                                                     \
            vec->cap = 0;                                                                        \
        }                                                                                        \
    }                                                                                            \
    void RawVec_shrink_to_fit(RawVec_of_##T *vec, size_t len, size_t elem_size)                  \
    {                                                                                            \
        if (len < vec->cap)                                                                      \
        {                                                                                        \
            if (len == 0)                                                                        \
            {                                                                                    \
                vec->alloc.deallocate(vec->ptr);                                                 \
                vec->ptr = NULL;                                                                 \
                vec->cap = 0;                                                                    \
            }                                                                                    \
            else                                                                                 \
            {                                                                                    \
                size_t new_size = len * elem_size;                                               \
                void *new_ptr = vec->alloc.reallocate(vec->ptr, vec->cap * elem_size, new_size); \
                assert(new_ptr != NULL);                                                         \
                vec->ptr = new_ptr;                                                              \
                vec->cap = len;                                                                  \
            }                                                                                    \
        }                                                                                        \
    }                                                                                            \
    void *RawVec_ptr(const RawVec_of_##T *vec)                                                   \
    {                                                                                            \
        return vec->ptr;                                                                         \
    }

#endif // _RAWVEC_H_INCLUDED_
