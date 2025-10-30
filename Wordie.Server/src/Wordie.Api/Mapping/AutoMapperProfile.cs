using AutoMapper;
using Wordie.Api.DTOs;
using Wordie.Domain.Entities;

namespace Wordie.Api.Mapping;

public class AutoMapperProfile : Profile
{
    public AutoMapperProfile()
    {
        CreateMap<Word, WordDto>();
        CreateMap<WordSet, WordSetDto>();
        CreateMap<ApplicationUser, UserDto>();
    }
}
