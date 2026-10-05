export function getUrlParameter(name) {
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(window.location.href);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

// Тестовый пользователь: если в URL есть testUser=yes и непустой testUserKey,
// прокидываем их в регистрацию
export function getTestUserParams() {
  const testUser = getUrlParameter("testUser");
  const testUserKey = getUrlParameter("testUserKey")?.trim();
  if (testUser !== "yes" || !testUserKey) return "";
  return `&testUser=yes&testUserKey=${encodeURIComponent(testUserKey)}`;
}
