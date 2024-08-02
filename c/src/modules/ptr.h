#ifndef _PTR_H_INCLUDED_
#define _PTR_H_INCLUDED_

#define Unique(T)             \
    typedef struct Unique_##T \
    {                         \
        T *ptr;               \
    };

#endif // _PTR_H_INCLUDED_
