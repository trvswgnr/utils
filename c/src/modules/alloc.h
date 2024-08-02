#ifndef _ALLOC_H_INCLUDED_
#define _ALLOC_H_INCLUDED_

#include <stdlib.h>
#include <stdbool.h>

typedef struct
{
    void *(*allocate)(size_t size);
    void (*deallocate)(void *ptr);
    void *(*reallocate)(void *ptr, size_t old_size, size_t new_size);
} Allocator;

// Function to create a custom allocator
Allocator create_allocator(
    void *(*allocate_func)(size_t),
    void (*deallocate_func)(void *),
    void *(*reallocate_func)(void *, size_t, size_t))
{
    return (Allocator){
        .allocate = allocate_func,
        .deallocate = deallocate_func,
        .reallocate = reallocate_func};
}

void *realloc_wrapper(void *ptr, size_t old_size, size_t new_size)
{
    (void)old_size; // Unused parameter
    return realloc(ptr, new_size);
}

Allocator GLOBAL_ALLOCATOR = {
    .allocate = malloc,
    .deallocate = free,
    .reallocate = realloc_wrapper};

#endif // _ALLOC_H_INCLUDED_
