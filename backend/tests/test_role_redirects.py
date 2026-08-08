from app.utils.routes import dashboard_path_for_role


def test_dashboard_paths_are_role_specific():
    assert dashboard_path_for_role("admin") == "/admin"
    assert dashboard_path_for_role("superadmin") == "/superadmin"
    assert dashboard_path_for_role("instructor") == "/instruktor-panel"
    assert dashboard_path_for_role("user") == "/kurslarim"
    assert dashboard_path_for_role(None) == "/kurslarim"
