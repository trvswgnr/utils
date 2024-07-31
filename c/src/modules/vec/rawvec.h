#include <stddef.h>
#include <stdbool.h>
#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <assert.h>

typedef struct {
    void *(*allocate)(size_t size);
    void (*deallocate)(void *ptr);
    void *(*reallocate)(void *ptr, size_t old_size, size_t new_size);
} Allocator;

typedef struct {
    void *ptr;
    size_t cap;
    Allocator alloc;
} RawVec;

// Initialize a new RawVec
RawVec RawVec_new(Allocator alloc) {
    return (RawVec){
        .ptr = NULL,
        .cap = 0,
        .alloc = alloc
    };
}

// Create a RawVec with a given capacity
RawVec RawVec_with_capacity(size_t capacity, size_t elem_size, Allocator alloc) {
    void *ptr = NULL;
    if (capacity > 0) {
        ptr = alloc.allocate(capacity * elem_size);
        assert(ptr != NULL);
    }
    return (RawVec){
        .ptr = ptr,
        .cap = capacity,
        .alloc = alloc
    };
}

// Get the capacity of the RawVec
size_t RawVec_capacity(const RawVec* vec, size_t elem_size) {
    return vec->cap;
}

// Grow the RawVec to accommodate more elements
void RawVec_grow(RawVec* vec, size_t needed_cap, size_t elem_size) {
    size_t new_cap = vec->cap == 0 ? 1 : vec->cap * 2;
    while (new_cap < needed_cap) {
        new_cap *= 2;
    }
    size_t new_size = new_cap * elem_size;
    void *new_ptr;
    if (vec->ptr == NULL) {
        new_ptr = vec->alloc.allocate(new_size);
    } else {
        new_ptr = vec->alloc.reallocate(vec->ptr, vec->cap * elem_size, new_size);
    }
    assert(new_ptr != NULL);
    vec->ptr = new_ptr;
    vec->cap = new_cap;
}

// Reserve additional capacity
void RawVec_reserve(RawVec* vec, size_t len, size_t additional, size_t elem_size) {
    size_t needed_cap = len + additional;
    if (needed_cap > vec->cap) {
        RawVec_grow(vec, needed_cap, elem_size);
    }
}

// Free the memory used by the RawVec
void RawVec_drop(RawVec* vec) {
    if (vec->ptr != NULL) {
        vec->alloc.deallocate(vec->ptr);
        vec->ptr = NULL;
        vec->cap = 0;
    }
}

void RawVec_shrink_to_fit(RawVec* vec, size_t len, size_t elem_size) {
    if (len < vec->cap) {
        if (len == 0) {
            vec->alloc.deallocate(vec->ptr);
            vec->ptr = NULL;
            vec->cap = 0;
        } else {
            size_t new_size = len * elem_size;
            void* new_ptr = vec->alloc.reallocate(vec->ptr, vec->cap * elem_size, new_size);
            assert(new_ptr != NULL);
            vec->ptr = new_ptr;
            vec->cap = len;
        }
    }
}
void* RawVec_ptr(const RawVec* vec) {
    return vec->ptr;
}