"use client";

import { BookOpen, ExternalLink, MessageCircle } from "lucide-react";
import { Fragment } from "react";

import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HelpPage() {
  return (
    <Fragment>
      <PageHeader
        description={"Get help and learn how to use Clarify AI"}
        title={"Help"}
      />

      <div
        className={`
          grid gap-4
          sm:grid-cols-2
          lg:grid-cols-3
        `}
      >
        {/* Documentation Card */}
        <Card
          className={`
            cursor-pointer transition-shadow
            hover:shadow-md
          `}
        >
          <CardHeader>
            <div className={"flex items-center gap-3"}>
              <div
                className={`
                  flex size-10 items-center justify-center rounded-lg bg-muted
                `}
              >
                <BookOpen className={"size-5 text-muted-foreground"} />
              </div>
              <div className={"flex-1"}>
                <CardTitle className={"flex items-center gap-2"}>
                  Documentation
                  <ExternalLink className={"size-3.5 text-muted-foreground"} />
                </CardTitle>
                <CardDescription>Learn the basics</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className={"text-sm text-muted-foreground"}>
              Explore guides and tutorials to get the most out of Clarify AI.
            </p>
          </CardContent>
        </Card>

        {/* Feedback Card */}
        <Card
          className={`
            cursor-pointer transition-shadow
            hover:shadow-md
          `}
        >
          <CardHeader>
            <div className={"flex items-center gap-3"}>
              <div
                className={`
                  flex size-10 items-center justify-center rounded-lg bg-muted
                `}
              >
                <MessageCircle className={"size-5 text-muted-foreground"} />
              </div>
              <div className={"flex-1"}>
                <CardTitle className={"flex items-center gap-2"}>
                  Send Feedback
                  <ExternalLink className={"size-3.5 text-muted-foreground"} />
                </CardTitle>
                <CardDescription>Share your thoughts</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className={"text-sm text-muted-foreground"}>
              Help us improve by sharing your feedback and suggestions.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Keyboard Shortcuts */}
      <div className={"mt-8"}>
        <h2 className={"mb-4 text-lg font-semibold"}>Keyboard Shortcuts</h2>
        <div className={"rounded-lg border border-border"}>
          <div
            className={`
              flex items-center justify-between border-b border-border px-4 py-3
            `}
          >
            <span className={"text-sm"}>Toggle sidebar</span>
            <kbd className={"rounded-sm bg-muted px-2 py-1 font-mono text-xs"}>
              Cmd/Ctrl + B
            </kbd>
          </div>
          <div className={"flex items-center justify-between px-4 py-3"}>
            <span className={"text-sm"}>More shortcuts coming soon...</span>
            <span className={"text-sm text-muted-foreground"}>-</span>
          </div>
        </div>
      </div>
    </Fragment>
  );
}
