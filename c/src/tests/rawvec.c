#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include "../modules/rawvec.h"
#include "../modules/test.h"

void *mock_allocate(size_t __size)
{
    return malloc(__size);
}

void mock_deallocate(void *ptr)
{
    free(ptr);
}

void *mock_reallocate(void *ptr, size_t old_size, size_t new_size)
{
    (void)old_size; // unused parameter
    return realloc(ptr, new_size);
}

Allocator mock_allocator = {
    .allocate = mock_allocate,
    .deallocate = mock_deallocate,
    .reallocate = mock_reallocate};

TEST(RawVec_new)
{
    RawVec vec = RawVec_new(mock_allocator);
    EXPECT(vec.ptr == NULL);
    EXPECT(vec.cap == 0);
    EXPECT(vec.alloc.allocate == mock_allocator.allocate);
    EXPECT(vec.alloc.reallocate == mock_allocator.reallocate);
    EXPECT(vec.alloc.deallocate == mock_allocator.deallocate);
};

TEST(RawVec_with_capacity)
{
    size_t capacity = 10;
    size_t elem_size = sizeof(int);
    RawVec vec = RawVec_with_capacity(capacity, elem_size, mock_allocator);
    EXPECT(vec.ptr != NULL);
    EXPECT(vec.cap == capacity);
    EXPECT(vec.alloc.allocate == mock_allocator.allocate);
    EXPECT(vec.alloc.reallocate == mock_allocator.reallocate);
    EXPECT(vec.alloc.deallocate == mock_allocator.deallocate);
    RawVec_drop(&vec);
    EXPECT(vec.ptr == NULL);
    EXPECT(vec.cap == 0);
}

TEST(RawVec_capacity)
{
    size_t capacity = 5;
    size_t elem_size = sizeof(double);
    RawVec vec = RawVec_with_capacity(capacity, elem_size, mock_allocator);
    EXPECT(RawVec_capacity(&vec) == capacity);
    RawVec_drop(&vec);
}

TEST(RawVec_grow)
{
    RawVec vec = RawVec_new(mock_allocator);
    size_t elem_size = sizeof(char);
    RawVec_grow(&vec, 10, elem_size);
    EXPECT(vec.cap >= 10);
    size_t old_cap = vec.cap;
    RawVec_grow(&vec, 20, elem_size);
    EXPECT(vec.cap > old_cap);
    RawVec_drop(&vec);
}

TEST(RawVec_reserve)
{
    RawVec vec = RawVec_new(mock_allocator);
    size_t elem_size = sizeof(int);
    RawVec_reserve(&vec, 0, 5, elem_size);
    EXPECT(vec.cap >= 5);
    size_t old_cap = vec.cap;
    RawVec_reserve(&vec, 5, 10, elem_size);
    EXPECT(vec.cap >= 15);
    EXPECT(vec.cap > old_cap);
    RawVec_drop(&vec);
}

TEST(RawVec_shrink_to_fit)
{
    RawVec vec = RawVec_with_capacity(10, sizeof(int), mock_allocator);
    RawVec_shrink_to_fit(&vec, 5, sizeof(int));
    EXPECT(vec.cap == 5);
    RawVec_shrink_to_fit(&vec, 0, sizeof(int));
    EXPECT(vec.cap == 0);
    EXPECT(vec.ptr == NULL);
}

TEST(RawVec_ptr)
{
    RawVec vec = RawVec_with_capacity(5, sizeof(int), mock_allocator);
    EXPECT(RawVec_ptr(&vec) == vec.ptr);
    RawVec_drop(&vec);
    EXPECT(RawVec_ptr(&vec) == NULL);
}

int main()
{
    return run_tests();
}
