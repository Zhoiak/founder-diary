# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]: Sign in to Founder Diary
      - generic [ref=e6]: Choose your preferred authentication method
    - generic [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]:
          - generic [ref=e10]: Email
          - textbox "Email" [ref=e11]
        - generic [ref=e12]:
          - generic [ref=e13]: Password
          - textbox "Password" [ref=e14]
        - button "Sign In" [ref=e15]
      - button "Don't have an account? Sign up" [ref=e17]
      - generic [ref=e18]: OR
      - button "Send Magic Link" [ref=e22]
      - generic [ref=e23]: OR
      - generic [ref=e26]:
        - button "Continue with Google" [ref=e27]
        - button "Continue with GitHub" [ref=e28]
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e34] [cursor=pointer]:
    - img [ref=e35] [cursor=pointer]
  - alert [ref=e38]
```