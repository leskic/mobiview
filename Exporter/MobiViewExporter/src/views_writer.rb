# encoding: UTF-8

require "json"

module MobiViewExporter
  module ViewsWriter
    extend self

    def write(model, pieces, folder)
      file = File.join(folder, "views.json")
      File.open(file, "w:utf-8") do |stream|
        stream.write(JSON.pretty_generate(ViewsBuilder.build(model, pieces)))
      end
      file
    end
  end
end
