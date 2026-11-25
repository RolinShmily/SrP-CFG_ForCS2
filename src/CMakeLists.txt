# Configure from the repository root to share versioning and test settings.
add_subdirectory(core)
if(SRP_BUILD_GUI)
    add_subdirectory(gui)
endif()
