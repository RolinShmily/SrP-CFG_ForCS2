# Configure from the repository root to share versioning and test settings.
add_subdirectory(core)
add_subdirectory(cli)
if(SRP_BUILD_GUI)
    add_subdirectory(gui)
endif()
